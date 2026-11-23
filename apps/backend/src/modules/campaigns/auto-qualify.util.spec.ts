import { resolveAutoQualifyPainPoint } from './auto-qualify.util';

describe('resolveAutoQualifyPainPoint', () => {
  it('maps missing or blank website to Sem site', () => {
    expect(resolveAutoQualifyPainPoint(null)).toBe('Sem site');
    expect(resolveAutoQualifyPainPoint(undefined)).toBe('Sem site');
    expect(resolveAutoQualifyPainPoint('')).toBe('Sem site');
    expect(resolveAutoQualifyPainPoint('   ')).toBe('Sem site');
  });

  it('maps Instagram profile URLs', () => {
    expect(resolveAutoQualifyPainPoint('https://www.instagram.com/clinica')).toBe('Instagram');
    expect(resolveAutoQualifyPainPoint('HTTP://INSTAGRAM.COM/foo')).toBe('Instagram');
  });

  it('maps Linktree URLs', () => {
    expect(resolveAutoQualifyPainPoint('https://linktr.ee/clinica')).toBe('Linktree');
    expect(resolveAutoQualifyPainPoint('https://LINKTR.EE/foo')).toBe('Linktree');
  });

  it('prefers Instagram when both tokens appear', () => {
    expect(resolveAutoQualifyPainPoint('https://linktr.ee/instagram-promo')).toBe('Instagram');
  });

  it('returns null for regular websites', () => {
    expect(resolveAutoQualifyPainPoint('https://clinica.example')).toBeNull();
  });
});
