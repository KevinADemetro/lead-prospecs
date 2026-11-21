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
      searchTerms: ['pet shop'],
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
        score: 85,
        scoreReasons: ['Possui website', 'Telefone confirmado'],
        websiteStatus: 'FOUND',
        whatsappStatus: 'CONFIRMED',
        qualificationStatus: 'QUALIFIED',
        trelloStatus: 'CREATED',
      },
    });
    await prisma.lead.update({
      where: { id: beta.id },
      data: { score: 40, websiteStatus: 'NOT_FOUND', trelloStatus: 'ERROR' },
    });
    await prisma.lead.update({
      where: { id: gamma.id },
      data: { websiteStatus: 'ERROR' },
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

  it('filters by statuses, category, city and score range', async () => {
    expect(await listNames('websiteStatus=NOT_FOUND')).toEqual(['Beta Banho e Tosa']);
    expect(await listNames('websiteStatus=ERROR')).toEqual(['Gamma Vet']);
    expect(await listNames('whatsappStatus=CONFIRMED')).toEqual(['Alpha Pet']);
    expect(await listNames('trelloStatus=ERROR')).toEqual(['Beta Banho e Tosa']);
    expect(await listNames('qualificationStatus=QUALIFIED')).toEqual(['Alpha Pet']);
    expect(await listNames('category=pet%20shop&sort=companyName&order=asc')).toEqual([
      'Alpha Pet',
      'Gamma Vet',
    ]);
    expect(await listNames('city=Curitiba&sort=companyName&order=asc')).toEqual([
      'Alpha Pet',
      'Gamma Vet',
    ]);
    expect(await listNames('scoreMin=50')).toEqual(['Alpha Pet']);
    expect(await listNames('scoreMin=30&scoreMax=50')).toEqual(['Beta Banho e Tosa']);
  });

  it('sorts by company fields and paginates', async () => {
    expect(await listNames('sort=companyName&order=asc')).toEqual([
      'Alpha Pet',
      'Beta Banho e Tosa',
      'Gamma Vet',
    ]);
    expect(await listNames('sort=score&order=asc')).toEqual([
      'Beta Banho e Tosa',
      'Alpha Pet',
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
    expect((await admin.get('/api/v1/leads?trelloStatus=SENT')).status).toBe(400);
    expect((await admin.get('/api/v1/leads?scoreMin=80&scoreMax=10')).status).toBe(400);
    expect((await admin.get('/api/v1/leads?scoreMin=101')).status).toBe(400);
  });

  it('returns lead details with the full company', async () => {
    const res = await admin.get(`/api/v1/leads/${ids.alpha}`);
    expect(res.status).toBe(200);
    expect(res.body.company).toMatchObject({
      legalName: 'Alpha Comércio de Rações Ltda',
      cnpj: '11222333000181',
      instagramUrl: 'https://instagram.com/alphapet',
      facebookUrl: null,
    });
    expect(res.body.company.dedupeKey).toBeUndefined();
    expect(res.body.scoreReasons).toEqual(['Possui website', 'Telefone confirmado']);
    expect(res.body.campaign.name).toBe('Pets Curitiba');
  });

  it('lists distinct filter options', async () => {
    const res = await admin.get('/api/v1/leads/filter-options');
    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual(['Banho e tosa', 'Pet shop']);
    expect(res.body.cities).toEqual(expect.arrayContaining(['Curitiba', 'Pinhais']));
  });
});
