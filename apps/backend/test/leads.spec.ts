import { INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PublicLead } from '@app/shared';
import { LeadsService } from '../src/modules/leads/leads.service';
import { PrismaService } from '../src/database/prisma.service';
import { loginAsAdmin, mutating, startTestApp, stopTestApp, type TestAgent } from './helpers';

describe('Leads listing and details', () => {
  let app: INestApplication;
  let postgres: StartedPostgreSqlContainer;
  let admin: TestAgent;
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    const ctx = await startTestApp();
    app = ctx.app;
    postgres = ctx.postgres;
    admin = (await loginAsAdmin(app)).http;

    const campaign = await mutating(admin, 'post', '/api/v1/campaigns', {
      name: 'Pets Curitiba',
      city: 'Curitiba',
      state: 'PR',
      categories: ['pet shop'],
    });
    const leads = app.get(LeadsService);
    const prisma = app.get(PrismaService);

    const alpha = await leads.addCompanyToCampaign(campaign.body.id, {
      name: 'Alpha Pet',
      legalName: 'Alpha Comércio de Rações Ltda',
      cnpj: '11.222.333/0001-81',
      category: 'Pet shop',
      city: 'Curitiba',
      state: 'PR',
      website: 'https://alpha.example',
      instagramUrl: 'https://instagram.com/alphapet',
    });
    const beta = await leads.addCompanyToCampaign(campaign.body.id, {
      name: 'Beta Banho e Tosa',
      category: 'Banho e tosa',
      city: 'Pinhais',
      googlePlaceId: 'place-beta',
    });
    const gamma = await leads.addCompanyToCampaign(campaign.body.id, {
      name: 'Gamma Vet',
      category: 'Pet shop',
      city: 'curitiba',
      googlePlaceId: 'place-gamma',
    });
    ids.alpha = alpha.id;
    ids.beta = beta.id;
    ids.gamma = gamma.id;

    await prisma.lead.update({
      where: { id: alpha.id },
      data: {
        websiteStatus: 'FOUND',
        qualificationStatus: 'QUALIFIED',
      },
    });
    await prisma.lead.update({
      where: { id: beta.id },
      data: { websiteStatus: 'NOT_FOUND' },
    });
    await prisma.lead.update({
      where: { id: gamma.id },
      data: { websiteStatus: 'ERROR' },
    });

    const painPoint = await mutating(admin, 'post', '/api/v1/pain-points', {
      name: 'Baixa conversão',
    });
    ids.painPoint = painPoint.body.id as string;
    await mutating(admin, 'patch', `/api/v1/leads/${alpha.id}`, {
      painPointId: ids.painPoint,
    });
  });

  afterAll(async () => {
    await stopTestApp({ app, postgres });
  });

  async function listNames(query: string): Promise<string[]> {
    const res = await admin.get(`/api/v1/leads?${query}`);
    expect(res.status).toBe(200);
    return (res.body.data as PublicLead[]).map((lead) => lead.company.name);
  }

  it('searches by name, legal name and CNPJ', async () => {
    expect(await listNames('search=beta')).toEqual(['Beta Banho e Tosa']);
    expect(await listNames('search=rações')).toEqual(['Alpha Pet']);
    expect(await listNames('search=11.222.333')).toEqual(['Alpha Pet']);
  });

  it('filters by statuses, category, city and pain point', async () => {
    expect(await listNames('websiteStatus=NOT_FOUND')).toEqual(['Beta Banho e Tosa']);
    expect(await listNames('websiteStatus=ERROR')).toEqual(['Gamma Vet']);
    expect(await listNames('qualificationStatus=QUALIFIED')).toEqual(['Alpha Pet']);
    expect(
      await listNames(
        'qualificationStatus=QUALIFIED&qualificationStatus=PENDING&sort=companyName&order=asc',
      ),
    ).toEqual(['Alpha Pet', 'Beta Banho e Tosa', 'Gamma Vet']);
    expect(await listNames('category=pet%20shop&sort=companyName&order=asc')).toEqual([
      'Alpha Pet',
      'Gamma Vet',
    ]);
    expect(await listNames('city=Curitiba&sort=companyName&order=asc')).toEqual([
      'Alpha Pet',
      'Gamma Vet',
    ]);
    expect(await listNames(`painPointId=${ids.painPoint}`)).toEqual(['Alpha Pet']);
  });

  it('updates and filters priority and notes', async () => {
    const updated = await mutating(admin, 'patch', `/api/v1/leads/${ids.alpha}`, {
      priority: true,
      notes: 'Alto potencial — dono engajado no Instagram',
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      priority: true,
      notes: 'Alto potencial — dono engajado no Instagram',
    });

    expect(await listNames('priority=true')).toEqual(['Alpha Pet']);
    expect(await listNames('priority=false')).toEqual(
      expect.arrayContaining(['Beta Banho e Tosa Premium', 'Gamma Vet']),
    );
    expect((await admin.get('/api/v1/leads?priority=maybe')).status).toBe(400);

    const cleared = await mutating(admin, 'patch', `/api/v1/leads/${ids.alpha}`, {
      notes: null,
    });
    expect(cleared.status).toBe(200);
    expect(cleared.body.notes).toBeNull();
  });

  it('sorts by company fields and paginates', async () => {
    expect(await listNames('sort=companyName&order=asc')).toEqual([
      'Alpha Pet',
      'Beta Banho e Tosa',
      'Gamma Vet',
    ]);
    const page = await admin.get('/api/v1/leads?sort=companyName&order=asc&limit=2&page=2');
    expect(page.body.meta).toMatchObject({ total: 3, totalPages: 2, page: 2 });
    expect(page.body.data[0].company.name).toBe('Gamma Vet');
    expect(page.body.data[0].company.website).toBeNull();
  });

  it('rejects invalid query parameters', async () => {
    expect((await admin.get('/api/v1/leads?sort=deletedAt')).status).toBe(400);
    expect((await admin.get('/api/v1/leads?websiteStatus=ONLINE')).status).toBe(400);
    expect((await admin.get('/api/v1/leads?sort=score')).status).toBe(400);
  });

  it('returns lead details with the full company and pain point', async () => {
    const res = await admin.get(`/api/v1/leads/${ids.alpha}`);
    expect(res.status).toBe(200);
    expect(res.body.company).toMatchObject({
      legalName: 'Alpha Comércio de Rações Ltda',
      cnpj: '11222333000181',
      whatsappUrl: null,
      instagramUrl: 'https://instagram.com/alphapet',
      facebookUrl: null,
    });
    expect(res.body.company.dedupeKey).toBeUndefined();
    expect(res.body.score).toBeUndefined();
    expect(res.body.whatsappStatus).toBeUndefined();
    expect(res.body.instagramStatus).toBeUndefined();
    expect(res.body.facebookStatus).toBeUndefined();
    expect(res.body.trelloStatus).toBeUndefined();
    expect(res.body.campaign.name).toBe('Pets Curitiba');
    expect(res.body.painPoint).toEqual({ id: ids.painPoint, name: 'Baixa conversão' });
    expect(res.body.painPointId).toBe(ids.painPoint);
  });

  it('lists distinct filter options including pain points', async () => {
    const res = await admin.get('/api/v1/leads/filter-options');
    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual(['Banho e tosa', 'Pet shop']);
    expect(res.body.cities).toEqual(expect.arrayContaining(['Curitiba', 'Pinhais']));
    expect(res.body.painPoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: ids.painPoint, name: 'Baixa conversão' }),
      ]),
    );
  });

  it('clears pain point via patch', async () => {
    const cleared = await mutating(admin, 'patch', `/api/v1/leads/${ids.alpha}`, {
      painPointId: null,
    });
    expect(cleared.status).toBe(200);
    expect(cleared.body.painPointId).toBeNull();
    expect(cleared.body.painPoint).toBeNull();
    await mutating(admin, 'patch', `/api/v1/leads/${ids.alpha}`, {
      painPointId: ids.painPoint,
    });
  });

  it('updates qualification, website validity and company fields', async () => {
    const updated = await mutating(admin, 'patch', `/api/v1/leads/${ids.beta}`, {
      qualificationStatus: 'QUALIFIED',
      websiteStatus: 'FOUND',
      company: {
        name: 'Beta Banho e Tosa Premium',
        phone: '41999990000',
        website: 'https://beta.example',
        city: 'Curitiba',
        state: 'PR',
      },
    });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      qualificationStatus: 'QUALIFIED',
      websiteStatus: 'FOUND',
      company: {
        name: 'Beta Banho e Tosa Premium',
        phone: '41999990000',
        website: 'https://beta.example',
        city: 'Curitiba',
        state: 'PR',
      },
    });

    const disqualified = await mutating(admin, 'patch', `/api/v1/leads/${ids.beta}`, {
      qualificationStatus: 'DISQUALIFIED',
      websiteStatus: 'NOT_FOUND',
    });
    expect(disqualified.status).toBe(200);
    expect(disqualified.body.qualificationStatus).toBe('DISQUALIFIED');
    expect(disqualified.body.websiteStatus).toBe('NOT_FOUND');

    const autoQualified = await mutating(admin, 'patch', `/api/v1/leads/${ids.beta}`, {
      qualificationStatus: 'AUTO_QUALIFIED',
    });
    expect(autoQualified.status).toBe(400);
  });
});
