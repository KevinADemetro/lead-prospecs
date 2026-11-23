import { Injectable, Logger } from '@nestjs/common';
import { CampaignRecord } from '../../common/database/records';
import { DoresRepository } from '../dores/dores.repository';
import { LeadsService } from '../leads/leads.service';
import { PlacesClient } from '../places/places.client';
import { placeToCompanyInput } from '../places/places.mapper';
import {
  AUTO_QUALIFY_DOR_NAMES,
  resolveAutoQualifyDor,
  type AutoQualifyDorName,
} from './auto-qualify.util';

@Injectable()
export class CampaignRunnerService {
  private readonly logger = new Logger(CampaignRunnerService.name);

  constructor(
    private readonly places: PlacesClient,
    private readonly leads: LeadsService,
    private readonly dores: DoresRepository,
  ) {}

  /**
   * Runs Text Search (New) for each campaign category × location and upserts leads.
   * Caps at 60 places per category query (Places API pagination limit).
   * Dedupes by Google Place ID across categories so the same establishment is
   * linked once per campaign run.
   * Auto-qualifies PENDING leads with no website / Instagram / Linktree URLs.
   */
  async run(campaign: CampaignRecord): Promise<{ imported: number }> {
    const location = formatLocation(campaign);
    const seenPlaceIds = new Set<string>();
    let imported = 0;
    const autoDores = await this.loadAutoQualifyDores();

    for (const category of campaign.categories) {
      const textQuery = `${category} em ${location}`;
      this.logger.log(`Prospecting campaign=${campaign.id} query="${textQuery}"`);

      const places = await this.places.searchAll(textQuery);
      for (const place of places) {
        const company = placeToCompanyInput(place, category);
        if (!company?.googlePlaceId) {
          continue;
        }
        if (seenPlaceIds.has(company.googlePlaceId)) {
          continue;
        }
        seenPlaceIds.add(company.googlePlaceId);
        await this.leads.addCompanyToCampaign(
          campaign.id,
          company,
          this.buildAutoQualify(company.website, autoDores),
        );
        imported += 1;
      }
    }

    return { imported };
  }

  private async loadAutoQualifyDores(): Promise<Map<AutoQualifyDorName, string>> {
    const found = await this.dores.findActiveByNames([...AUTO_QUALIFY_DOR_NAMES]);
    const map = new Map<AutoQualifyDorName, string>();
    for (const name of AUTO_QUALIFY_DOR_NAMES) {
      const dor = found.get(name);
      if (dor) {
        map.set(name, dor.id);
      } else {
        this.logger.warn(
          `Dor "${name}" not found — leads matching this rule will stay PENDING`,
        );
      }
    }
    return map;
  }

  private buildAutoQualify(
    website: string | null | undefined,
    autoDores: Map<AutoQualifyDorName, string>,
  ): { dorId: string; websiteStatus?: 'NOT_FOUND' } | undefined {
    const dorName = resolveAutoQualifyDor(website);
    if (!dorName) {
      return undefined;
    }
    const dorId = autoDores.get(dorName);
    if (!dorId) {
      return undefined;
    }
    return {
      dorId,
      ...(dorName === 'Sem site' ? { websiteStatus: 'NOT_FOUND' as const } : {}),
    };
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
