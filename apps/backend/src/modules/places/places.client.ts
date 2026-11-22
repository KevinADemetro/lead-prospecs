import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { EnvService } from '../../config/env.service';
import type { PlacesSearchParams, PlacesTextSearchPlace, PlacesTextSearchResponse } from './places.types';

const PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

/** Enterprise SKU fields (phone/website/hours) plus Pro fields needed for address parsing. */
export const PLACES_TEXT_SEARCH_FIELD_MASK = [
  'places.id',
  'places.name',
  'places.displayName',
  'places.primaryType',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.formattedAddress',
  'places.addressComponents',
  'places.googleMapsUri',
  'places.websiteUri',
  'places.regularOpeningHours',
  'nextPageToken',
].join(',');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGES = 3;
const REQUEST_TIMEOUT_MS = 15_000;
const PAGE_TOKEN_DELAY_MS = 1_500;

@Injectable()
export class PlacesClient {
  private readonly logger = new Logger(PlacesClient.name);

  constructor(private readonly env: EnvService) {}

  /** Fetches up to 60 places for a text query (3 pages × 20). */
  async searchAll(textQuery: string): Promise<PlacesTextSearchPlace[]> {
    const places: PlacesTextSearchPlace[] = [];
    let pageToken: string | undefined;

    for (let page = 0; page < MAX_PAGES; page += 1) {
      if (page > 0 && pageToken) {
        await sleep(PAGE_TOKEN_DELAY_MS);
      }

      const response = await this.searchText({
        textQuery,
        pageToken,
        pageSize: DEFAULT_PAGE_SIZE,
      });

      if (response.places?.length) {
        places.push(...response.places);
      }

      pageToken = response.nextPageToken?.trim() || undefined;
      if (!pageToken) {
        break;
      }
    }

    return places;
  }

  async searchText(params: PlacesSearchParams): Promise<PlacesTextSearchResponse> {
    const body: Record<string, unknown> = {
      textQuery: params.textQuery,
      pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
      languageCode: 'pt-BR',
      regionCode: 'BR',
    };
    if (params.pageToken) {
      body.pageToken = params.pageToken;
    }

    let response: Response;
    try {
      response = await fetch(PLACES_TEXT_SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.env.values.GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': PLACES_TEXT_SEARCH_FIELD_MASK,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error('Places Text Search request failed', error instanceof Error ? error.stack : error);
      throw new ServiceUnavailableException('Falha ao consultar o Google Places');
    }

    if (!response.ok) {
      const detail = await safeErrorDetail(response);
      this.logger.error(`Places Text Search HTTP ${response.status}: ${detail}`);
      throw new BadGatewayException('Google Places retornou erro na busca');
    }

    return (await response.json()) as PlacesTextSearchResponse;
  }
}

async function safeErrorDetail(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
