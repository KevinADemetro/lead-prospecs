import type { CompanyOpeningHours } from '@app/shared';
import { CompanyInput } from '../companies/company-identity.util';
import type { PlacesAddressComponent, PlacesTextSearchPlace } from './places.types';

function componentLong(
  components: PlacesAddressComponent[] | undefined,
  type: string,
): string | null {
  const match = components?.find((component) => component.types?.includes(type));
  const value = match?.longText?.trim();
  return value || null;
}

function componentShort(
  components: PlacesAddressComponent[] | undefined,
  type: string,
): string | null {
  const match = components?.find((component) => component.types?.includes(type));
  const value = match?.shortText?.trim() || match?.longText?.trim();
  return value || null;
}

/** Prefer neighborhood; Brazilian addresses often use sublocality_level_1 as bairro. */
export function extractNeighborhood(
  components: PlacesAddressComponent[] | undefined,
): string | null {
  return (
    componentLong(components, 'neighborhood') ??
    componentLong(components, 'sublocality_level_1') ??
    componentLong(components, 'sublocality')
  );
}

export function extractCity(components: PlacesAddressComponent[] | undefined): string | null {
  return (
    componentLong(components, 'locality') ??
    componentLong(components, 'administrative_area_level_2')
  );
}

export function extractState(components: PlacesAddressComponent[] | undefined): string | null {
  return componentShort(components, 'administrative_area_level_1');
}

export function extractCountry(components: PlacesAddressComponent[] | undefined): string | null {
  return componentShort(components, 'country');
}

function toOpeningHours(value: CompanyOpeningHours | undefined): CompanyOpeningHours | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return {
    openNow: value.openNow ?? null,
    weekdayDescriptions: Array.isArray(value.weekdayDescriptions)
      ? value.weekdayDescriptions.filter((item): item is string => typeof item === 'string')
      : null,
    periods: Array.isArray(value.periods) ? value.periods : null,
  };
}

/**
 * Maps a Places Text Search (New) place into company upsert input.
 * `category` is the campaign search term; `niche` is Places `primaryType`.
 */
export function placeToCompanyInput(
  place: PlacesTextSearchPlace,
  category: string,
): CompanyInput | null {
  const name = place.displayName?.text?.trim();
  const googlePlaceId = place.id?.trim();
  if (!name || !googlePlaceId) {
    return null;
  }

  const components = place.addressComponents;
  const phone = place.nationalPhoneNumber?.trim() || place.internationalPhoneNumber?.trim() || null;

  return {
    name,
    category,
    niche: place.primaryType?.trim() || null,
    phone,
    website: place.websiteUri?.trim() || null,
    address: place.formattedAddress?.trim() || null,
    neighborhood: extractNeighborhood(components),
    city: extractCity(components),
    state: extractState(components),
    country: extractCountry(components),
    googlePlaceId,
    googleMapsUrl: place.googleMapsUri?.trim() || null,
    openingHours: toOpeningHours(place.regularOpeningHours),
  };
}
