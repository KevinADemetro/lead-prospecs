import {
  extractCity,
  extractNeighborhood,
  extractState,
  placeToCompanyInput,
} from './places.mapper';

describe('places.mapper', () => {
  const components = [
    { longText: 'Boa Viagem', shortText: 'Boa Viagem', types: ['neighborhood'] },
    { longText: 'Recife', shortText: 'Recife', types: ['locality'] },
    { longText: 'Pernambuco', shortText: 'PE', types: ['administrative_area_level_1'] },
    { longText: 'Brasil', shortText: 'BR', types: ['country'] },
  ];

  it('extracts city, state and neighborhood from addressComponents', () => {
    expect(extractNeighborhood(components)).toBe('Boa Viagem');
    expect(extractCity(components)).toBe('Recife');
    expect(extractState(components)).toBe('PE');
  });

  it('falls back to sublocality_level_1 for Brazilian bairro', () => {
    expect(
      extractNeighborhood([
        { longText: 'Centro', types: ['sublocality_level_1', 'sublocality'] },
      ]),
    ).toBe('Centro');
  });

  it('maps a Places result into company input', () => {
    const company = placeToCompanyInput(
      {
        id: 'ChIJ123',
        name: 'places/ChIJ123',
        displayName: { text: 'Pet Feliz' },
        primaryType: 'pet_store',
        nationalPhoneNumber: '(81) 98888-7777',
        internationalPhoneNumber: '+55 81 98888-7777',
        formattedAddress: 'Rua A, 10 - Boa Viagem, Recife - PE',
        addressComponents: components,
        googleMapsUri: 'https://maps.google.com/?cid=1',
        websiteUri: 'https://petfeliz.example',
        regularOpeningHours: {
          openNow: true,
          weekdayDescriptions: ['segunda-feira: 09:00 – 18:00'],
        },
      },
      'pet shop',
    );

    expect(company).toMatchObject({
      name: 'Pet Feliz',
      category: 'pet shop',
      niche: 'pet_store',
      phone: '(81) 98888-7777',
      website: 'https://petfeliz.example',
      neighborhood: 'Boa Viagem',
      city: 'Recife',
      state: 'PE',
      country: 'BR',
      googlePlaceId: 'ChIJ123',
      googleMapsUrl: 'https://maps.google.com/?cid=1',
    });
    expect(company?.openingHours?.weekdayDescriptions?.[0]).toContain('segunda-feira');
  });

  it('falls back to places/ resource name when id is missing', () => {
    const company = placeToCompanyInput(
      {
        name: 'places/ChIJFallback',
        displayName: { text: 'Pet Feliz' },
      },
      'pet shop',
    );
    expect(company?.googlePlaceId).toBe('ChIJFallback');
  });

  it('returns null when display name or place id is missing', () => {
    expect(placeToCompanyInput({ displayName: { text: 'X' } }, 'pet')).toBeNull();
    expect(placeToCompanyInput({ id: 'ChIJ' }, 'pet')).toBeNull();
  });
});
