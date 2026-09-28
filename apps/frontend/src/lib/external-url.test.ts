import { describe, expect, it } from 'vitest';
import { displayUrl, googleMapsLink, toExternalUrl, whatsappLink } from './external-url';

describe('external urls', () => {
  it('normalizes http(s) urls and rejects unsafe values', () => {
    expect(toExternalUrl('www.padaria.com.br')).toBe('https://www.padaria.com.br/');
    expect(toExternalUrl('http://padaria.com.br/contato')).toBe('http://padaria.com.br/contato');
    expect(toExternalUrl('javascript:alert(1)')).toBeNull();
    expect(toExternalUrl('data:text/html,hi')).toBeNull();
    expect(toExternalUrl('not a url')).toBeNull();
    expect(toExternalUrl('')).toBeNull();
    expect(toExternalUrl(null)).toBeNull();
  });

  it('formats urls for display', () => {
    expect(displayUrl('https://www.padaria.com.br/')).toBe('padaria.com.br');
  });

  it('builds google maps links from stored url, place id or address', () => {
    expect(googleMapsLink({ name: 'X', googleMapsUrl: 'https://maps.google.com/?cid=1' })).toBe(
      'https://maps.google.com/?cid=1',
    );
    expect(googleMapsLink({ name: 'Pet Feliz', googlePlaceId: 'abc' })).toContain(
      'query_place_id=abc',
    );
    expect(googleMapsLink({ name: 'Pet Feliz', city: 'Curitiba' })).toContain(
      'query=Pet+Feliz%2C+Curitiba',
    );
    expect(googleMapsLink({ name: 'Pet Feliz' })).toBeNull();
    expect(googleMapsLink({ name: 'X', googleMapsUrl: 'javascript:alert(1)' })).toBeNull();
  });

  it('builds whatsapp links with the brazilian country code', () => {
    expect(whatsappLink('(41) 99999-8888')).toBe('https://wa.me/5541999998888');
    expect(whatsappLink('+55 41 3333-4444')).toBe('https://wa.me/554133334444');
    expect(whatsappLink('123')).toBeNull();
  });
});
