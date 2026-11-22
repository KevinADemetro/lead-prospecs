import { Injectable, Logger } from '@nestjs/common';
import { CampaignRecord } from '../../common/database/records';
import { LeadsService } from '../leads/leads.service';
import { PlacesClient } from '../places/places.client';
import { placeToCompanyInput } from '../places/places.mapper';

@Injectable()
export class CampaignRunnerService {
  private readonly logger = new Logger(CampaignRunnerService.name);

  constructor(
    private readonly places: PlacesClient,
    private readonly leads: LeadsService,
  ) {}

  /**
   * Runs Text Search (New) for each campaign category × location and upserts leads.
   * Caps at 60 places per category query (Places API pagination limit).
   */
  async run(campaign: CampaignRecord): Promise<{ imported: number }> {
    const location = formatLocation(campaign);
    let imported = 0;

    for (const category of campaign.categories) {
      const textQuery = `${category} em ${location}`;
      this.logger.log(`Prospecting campaign=${campaign.id} query="${textQuery}"`);

      const places = await this.places.searchAll(textQuery);
      for (const place of places) {
        const company = placeToCompanyInput(place, category);
        if (!company) {
          continue;
        }
        await this.leads.addCompanyToCampaign(campaign.id, company);
        imported += 1;
      }
    }

    return { imported };
  }
}

function formatLocation(campaign: CampaignRecord): string {
  if (campaign.city && campaign.state) {
    return `${campaign.city}, ${campaign.state}`;
  }
  if (campaign.city) {
    return campaign.city;
  }
  return campaign.location;
}
