import { CampaignRunnerService } from './campaign-runner.service';
import type { CampaignRecord } from '../../common/database/records';
import type { PlacesClient } from '../places/places.client';
import type { LeadsService } from '../leads/leads.service';
import type { DoresRepository } from '../dores/dores.repository';

describe('CampaignRunnerService', () => {
  const campaign: CampaignRecord = {
    id: 'campaign-1',
    name: 'Dentistas',
    description: '',
    location: 'Laguna, SC',
    city: 'Laguna',
    state: 'SC',
    categories: ['dentista', 'odontologia'],
    status: 'RUNNING',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    leadCount: 0,
    qualifiedLeadCount: 0,
  };

  const dorIds = {
    'Sem site': 'dor-sem-site',
    Instagram: 'dor-instagram',
    Linktree: 'dor-linktree',
  };

  function buildRunner(searchAll: jest.Mock, addCompanyToCampaign: jest.Mock) {
    const findActiveByNames = jest.fn().mockResolvedValue(
      new Map([
        ['Sem site', { id: dorIds['Sem site'], name: 'Sem site' }],
        ['Instagram', { id: dorIds.Instagram, name: 'Instagram' }],
        ['Linktree', { id: dorIds.Linktree, name: 'Linktree' }],
      ]),
    );
    return new CampaignRunnerService(
      { searchAll } as unknown as PlacesClient,
      { addCompanyToCampaign } as unknown as LeadsService,
      { findActiveByNames } as unknown as DoresRepository,
    );
  }

  it('imports each Google Place ID only once across categories', async () => {
    const placeA = {
      id: 'ChIJ-A',
      displayName: { text: 'Clínica A' },
      formattedAddress: 'Rua 1',
      websiteUri: 'https://clinica-a.example',
    };
    const placeB = {
      id: 'ChIJ-B',
      displayName: { text: 'Clínica B' },
      formattedAddress: 'Rua 2',
      websiteUri: 'https://clinica-b.example',
    };
    const placeAAgain = {
      name: 'places/ChIJ-A',
      displayName: { text: 'Clinica A' },
      formattedAddress: 'Rua 1',
      websiteUri: 'https://clinica-a.example',
    };

    const searchAll = jest
      .fn()
      .mockResolvedValueOnce([placeA, placeB])
      .mockResolvedValueOnce([placeAAgain, placeB]);
    const addCompanyToCampaign = jest.fn().mockResolvedValue({ id: 'lead' });

    const result = await buildRunner(searchAll, addCompanyToCampaign).run(campaign);

    expect(result.imported).toBe(2);
    expect(addCompanyToCampaign).toHaveBeenCalledTimes(2);
    expect(addCompanyToCampaign).toHaveBeenNthCalledWith(
      1,
      'campaign-1',
      expect.objectContaining({ googlePlaceId: 'ChIJ-A', category: 'dentista' }),
      undefined,
    );
    expect(addCompanyToCampaign).toHaveBeenNthCalledWith(
      2,
      'campaign-1',
      expect.objectContaining({ googlePlaceId: 'ChIJ-B', category: 'dentista' }),
      undefined,
    );
  });

  it('auto-qualifies no website, Instagram and Linktree places', async () => {
    const searchAll = jest.fn().mockResolvedValueOnce([
      { id: 'ChIJ-1', displayName: { text: 'Sem Site' } },
      {
        id: 'ChIJ-2',
        displayName: { text: 'No Insta' },
        websiteUri: 'https://instagram.com/clinica',
      },
      {
        id: 'ChIJ-3',
        displayName: { text: 'No Linktree' },
        websiteUri: 'https://linktr.ee/clinica',
      },
      {
        id: 'ChIJ-4',
        displayName: { text: 'Site normal' },
        websiteUri: 'https://clinica.example',
      },
    ]);
    const addCompanyToCampaign = jest.fn().mockResolvedValue({ id: 'lead' });

    await buildRunner(searchAll, addCompanyToCampaign).run({
      ...campaign,
      categories: ['dentista'],
    });

    expect(addCompanyToCampaign).toHaveBeenNthCalledWith(
      1,
      'campaign-1',
      expect.objectContaining({ googlePlaceId: 'ChIJ-1', website: null }),
      { dorId: dorIds['Sem site'], websiteStatus: 'NOT_FOUND' },
    );
    expect(addCompanyToCampaign).toHaveBeenNthCalledWith(
      2,
      'campaign-1',
      expect.objectContaining({ googlePlaceId: 'ChIJ-2' }),
      { dorId: dorIds.Instagram },
    );
    expect(addCompanyToCampaign).toHaveBeenNthCalledWith(
      3,
      'campaign-1',
      expect.objectContaining({ googlePlaceId: 'ChIJ-3' }),
      { dorId: dorIds.Linktree },
    );
    expect(addCompanyToCampaign).toHaveBeenNthCalledWith(
      4,
      'campaign-1',
      expect.objectContaining({ googlePlaceId: 'ChIJ-4' }),
      undefined,
    );
  });
});
