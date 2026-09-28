import {
  buildDedupeKey,
  companyIdentity,
  mergeCompanyData,
  normalizeCnpj,
  normalizePhone,
  toCompanyData,
} from './company-identity.util';
import { CompanyRecord } from '../../common/database/records';

describe('company-identity.util', () => {
  it('normalizes CNPJ to 14 digits or null', () => {
    expect(normalizeCnpj('12.345.678/0001-95')).toBe('12345678000195');
    expect(normalizeCnpj('123')).toBeNull();
    expect(normalizeCnpj(undefined)).toBeNull();
  });

  it('normalizes phones ignoring formatting and country code', () => {
    expect(normalizePhone('+55 (11) 98765-4321')).toBe('11987654321');
    expect(normalizePhone('011 98765-4321')).toBe('11987654321');
  });

  it('builds the same dedupe key for equivalent name, phone and address', () => {
    const a = buildDedupeKey({
      name: 'Padaria São João',
      phone: '(11) 98765-4321',
      address: 'Rua das Flores, 100',
    });
    const b = buildDedupeKey({
      name: '  PADARIA SAO JOAO ',
      phone: '+55 11 987654321',
      address: 'rua das flores 100',
    });
    expect(a).not.toBeNull();
    expect(a).toBe(b);
  });

  it('does not build a dedupe key from the name alone', () => {
    expect(buildDedupeKey({ name: 'Padaria' })).toBeNull();
  });

  it('extracts identity in priority fields', () => {
    expect(
      companyIdentity({ name: 'X', cnpj: '12.345.678/0001-95', googlePlaceId: ' place-1 ' }),
    ).toEqual({ cnpj: '12345678000195', googlePlaceId: 'place-1', dedupeKey: null });
  });

  it('merges without replacing existing identity fields or erasing known data', () => {
    const existing: CompanyRecord = {
      ...toCompanyData({ name: 'Old', cnpj: '12345678000195', phone: '1133334444' }),
      id: 'id',
      dedupeKey: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null,
    };
    const merged = mergeCompanyData(
      existing,
      toCompanyData({ name: 'New', cnpj: '99999999000199', googlePlaceId: 'place-1' }),
    );
    expect(merged.name).toBe('New');
    expect(merged.cnpj).toBe('12345678000195');
    expect(merged.googlePlaceId).toBe('place-1');
    expect(merged.phone).toBe('1133334444');
  });
});
