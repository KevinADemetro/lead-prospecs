import { Injectable, Logger } from '@nestjs/common';
import { CampaignRecord } from '../../common/database/records';
import { PainPointsRepository } from '../pain-points/pain-points.repository';
import { LeadsService } from '../leads/leads.service';
import { PlacesClient } from '../places/places.client';
import { placeToCompanyInput } from '../places/places.mapper';
import {
  AUTO_QUALIFY_PAIN_POINT_NAMES,
  resolveAutoQualifyPainPoint,
  type AutoQualifyPainPointName,
} from './auto-qualify.util';

@Injectable()
export class CampaignRunnerService {
  private readonly logger = new Logger(CampaignRunnerService.name);

  constructor(
    private readonly places: PlacesClient,
    private readonly leads: LeadsService,
    private readonly painPoints: PainPointsRepository,
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
    const autoPainPoints = await this.loadAutoQualifyPainPoints();

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
          this.buildAutoQualify(company.website, autoPainPoints),
        );
        imported += 1;
      }
    }

    return { imported };
  }

  private async loadAutoQualifyPainPoints(): Promise<Map<AutoQualifyPainPointName, string>> {
    const found = await this.painPoints.findActiveByNames([...AUTO_QUALIFY_PAIN_POINT_NAMES]);
    const map = new Map<AutoQualifyPainPointName, string>();
    for (const name of AUTO_QUALIFY_PAIN_POINT_NAMES) {
      const painPoint = found.get(name);
      if (painPoint) {
        map.set(name, painPoint.id);
      } else {
        this.logger.warn(
          `Pain point "${name}" not found — leads matching this rule will stay PENDING`,
        );
      }
    }
    return map;
  }

  private buildAutoQualify(
    website: string | null | undefined,
    autoPainPoints: Map<AutoQualifyPainPointName, string>,
  ): { painPointId: string; websiteStatus?: 'NOT_FOUND' } | undefined {
    const painPointName = resolveAutoQualifyPainPoint(website);
    if (!painPointName) {
      return undefined;
    }
    const painPointId = autoPainPoints.get(painPointName);
    if (!painPointId) {
      return undefined;
    }
    return {
      painPointId,
      ...(painPointName === 'Sem site' ? { websiteStatus: 'NOT_FOUND' as const } : {}),
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
