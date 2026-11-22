import type { CompanyOpeningHours } from '@app/shared';

export type PlacesAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

export type PlacesTextSearchPlace = {
  id?: string;
  name?: string;
  displayName?: { text?: string; languageCode?: string };
  primaryType?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  formattedAddress?: string;
  addressComponents?: PlacesAddressComponent[];
  googleMapsUri?: string;
  websiteUri?: string;
  regularOpeningHours?: CompanyOpeningHours;
};

export type PlacesTextSearchResponse = {
  places?: PlacesTextSearchPlace[];
  nextPageToken?: string;
};

export type PlacesSearchParams = {
  textQuery: string;
  pageToken?: string;
  pageSize?: number;
};
