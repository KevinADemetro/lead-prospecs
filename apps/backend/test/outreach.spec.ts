import { INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PERMISSIONS } from '@app/shared';
import { LeadsService } from '../src/modules/leads/leads.service';
import { PrismaService } from '../src/database/prisma.service';
import {
  loginAs,
  loginAsAdmin,
  mutating,
  startTestApp,
  stopTestApp,
  type TestAgent,
} from './helpers';

describe('Outreach', () => {
  let app: INestApplication;
  let postgres: StartedPostgreSqlContainer;
  let admin: TestAgent;
  let prisma: PrismaService;

  beforeAll(async () => {
    const ctx = await startTestApp();
    app = ctx.app;
    postgres = ctx.postgres;
    admin = (await loginAsAdmin(app)).http;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await stopTestApp({ app, postgres });
  });

  async function seedQualifiedLead(suffix: string) {
    const campaign = await mutating(admin, 'post', '/api/v1/campaigns', {
      name: `Campanha Outreach ${suffix}`,
      city: 'Curitiba',
      state: 'PR',
      categories: ['clinica'],
    });
    expect(campaign.status).toBe(201);
    const leads = app.get(LeadsService);
    const lead = await leads.addCompanyToCampaign(campaign.body.id, {
      name: `Empresa Outreach ${suffix}`,
      phone: '41999990000',
      whatsappUrl: suffix === 'wa' ? 'https://wa.me/5541999990000' : undefined,
      googlePlaceId: `place-outreach-${suffix}`,
    });
    const qualified = await mutating(admin, 'patch', `/api/v1/leads/${lead.id}`, {
      qualificationStatus: 'QUALIFIED',
    });
    expect(qualified.status).toBe(200);
    return qualified.body;
  }

  it('creates outreach with D0 message and next follow-up at D+3', async () => {
    const lead = await seedQualifiedLead('create');
    const sentAt = '2026-01-01T15:00:00.000Z';
    const created = await mutating(admin, 'post', '/api/v1/outreach', {
      leadId: lead.id,
      message: 'Olá, primeira abordagem',
      sentAt,
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      leadId: lead.id,
      status: 'WAITING_REPLY',
      startedAt: '2026-01-01T00:00:00.000Z',
      nextFollowUpAt: '2026-01-04T00:00:00.000Z',
      whatsappLink: 'https://wa.me/41999990000',
    });
    expect(created.body.messages).toEqual([
      expect.objectContaining({
        step: 'INITIAL',
        message: 'Olá, primeira abordagem',
        sentAt: '2026-01-01T00:00:00.000Z',
      }),
    ]);
    expect(created.body.lead.company.name).toContain('Empresa Outreach');
  });

  it('enforces unique outreach per lead', async () => {
    const lead = await seedQualifiedLead('unique');
    const first = await mutating(admin, 'post', '/api/v1/outreach', {
      leadId: lead.id,
      message: 'Primeira',
    });
    expect(first.status).toBe(201);

    const second = await mutating(admin, 'post', '/api/v1/outreach', {
      leadId: lead.id,
      message: 'Segunda',
    });
    expect(second.status).toBe(409);
  });

  it('rejects outreach for non-qualified leads', async () => {
    const campaign = await mutating(admin, 'post', '/api/v1/campaigns', {
      name: 'Campanha Pending',
      city: 'Curitiba',
      state: 'PR',
      categories: ['clinica'],
    });
    const leads = app.get(LeadsService);
    const lead = await leads.addCompanyToCampaign(campaign.body.id, {
      name: 'Empresa Pending',
      googlePlaceId: 'place-outreach-pending',
    });

    const denied = await mutating(admin, 'post', '/api/v1/outreach', {
      leadId: lead.id,
      message: 'Não deveria criar',
    });
    expect(denied.status).toBe(400);
  });

  it('advances follow-ups from D0 and clears nextFollowUpAt when status changes', async () => {
    const lead = await seedQualifiedLead('follow');
    const created = await mutating(admin, 'post', '/api/v1/outreach', {
      leadId: lead.id,
      message: 'D0',
      sentAt: '2026-02-01T12:00:00.000Z',
    });
    expect(created.body.nextFollowUpAt).toBe('2026-02-04T00:00:00.000Z');

    const d3 = await mutating(admin, 'patch', `/api/v1/outreach/${created.body.id}`, {
      followUp: { step: 'FOLLOW_UP_D3', message: 'D+3', sentAt: '2026-02-04T10:00:00.000Z' },
    });
    expect(d3.status).toBe(200);
    expect(d3.body.nextFollowUpAt).toBe('2026-02-08T00:00:00.000Z');

    const d7 = await mutating(admin, 'patch', `/api/v1/outreach/${created.body.id}`, {
      followUp: { step: 'FOLLOW_UP_D7', message: 'D+7' },
    });
    expect(d7.body.nextFollowUpAt).toBe('2026-02-15T00:00:00.000Z');

    const d14 = await mutating(admin, 'patch', `/api/v1/outreach/${created.body.id}`, {
      followUp: { step: 'FOLLOW_UP_D14', message: 'D+14' },
    });
    expect(d14.body.nextFollowUpAt).toBeNull();
    expect(d14.body.messages).toHaveLength(4);

    const conversing = await mutating(admin, 'patch', `/api/v1/outreach/${created.body.id}`, {
      status: 'IN_CONVERSATION',
    });
    expect(conversing.body.status).toBe('IN_CONVERSATION');
    expect(conversing.body.nextFollowUpAt).toBeNull();
  });

  it('filters follow-ups for today and bulk-marks NO_REPLY after D0+21', async () => {
    const lead = await seedQualifiedLead('bulk');
    const startedAt = new Date();
    startedAt.setUTCDate(startedAt.getUTCDate() - 21);
    startedAt.setUTCHours(0, 0, 0, 0);

    const created = await mutating(admin, 'post', '/api/v1/outreach', {
      leadId: lead.id,
      message: 'Antiga',
      sentAt: startedAt.toISOString(),
    });
    expect(created.status).toBe(201);

    // Force nextFollowUpAt to today for filter coverage.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await prisma.outreach.update({
      where: { id: created.body.id },
      data: { nextFollowUpAt: today, status: 'WAITING_REPLY' },
    });

    const todayList = await admin.get('/api/v1/outreach?followUpToday=true');
    expect(todayList.status).toBe(200);
    expect(todayList.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created.body.id })]),
    );

    const marked = await mutating(admin, 'post', '/api/v1/outreach/mark-no-reply');
    expect(marked.status).toBe(201);
    expect(marked.body.updatedCount).toBeGreaterThanOrEqual(1);

    const detail = await admin.get(`/api/v1/outreach/${created.body.id}`);
    expect(detail.body.status).toBe('NO_REPLY');
    expect(detail.body.nextFollowUpAt).toBeNull();
  });

  it('prefers company whatsappUrl over phone for WhatsApp link', async () => {
    const lead = await seedQualifiedLead('wa');
    const created = await mutating(admin, 'post', '/api/v1/outreach', {
      leadId: lead.id,
      message: 'Com WhatsApp',
    });
    expect(created.status).toBe(201);
    expect(created.body.whatsappLink).toBe('https://wa.me/5541999990000');
  });

  it('exposes outreachId on leads and soft-deletes outreach', async () => {
    const lead = await seedQualifiedLead('lead-link');
    const created = await mutating(admin, 'post', '/api/v1/outreach', {
      leadId: lead.id,
      message: 'Link',
    });
    expect(created.status).toBe(201);

    const leadDetail = await admin.get(`/api/v1/leads/${lead.id}`);
    expect(leadDetail.body.outreachId).toBe(created.body.id);

    const removed = await mutating(admin, 'delete', `/api/v1/outreach/${created.body.id}`);
    expect(removed.status).toBe(204);

    const missing = await admin.get(`/api/v1/outreach/${created.body.id}`);
    expect(missing.status).toBe(404);

    const afterDelete = await admin.get(`/api/v1/leads/${lead.id}`);
    expect(afterDelete.body.outreachId).toBeNull();
  });

  it('requires outreach permissions', async () => {
    const role = await mutating(admin, 'post', '/api/v1/roles', {
      name: 'outreach-reader',
      permissions: [PERMISSIONS.OUTREACH_READ],
    });
    await mutating(admin, 'post', '/api/v1/users', {
      login: 'outreachreader',
      password: 'Outreach!Reader123',
      roleIds: [role.body.id],
      status: 'active',
    });
    const reader = await loginAs(app, 'outreachreader', 'Outreach!Reader123');
    expect((await reader.http.get('/api/v1/outreach')).status).toBe(200);
    const denied = await mutating(reader.http, 'post', '/api/v1/outreach', {
      leadId: '00000000-0000-4000-8000-000000000001',
      message: 'Sem permissão',
    });
    expect(denied.status).toBe(403);
  });
});
