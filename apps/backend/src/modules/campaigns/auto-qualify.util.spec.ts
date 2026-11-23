import { resolveAutoQualifyDor } from './auto-qualify.util';

describe('resolveAutoQualifyDor', () => {
  it('maps missing or blank website to Sem site', () => {
    expect(resolveAutoQualifyDor(null)).toBe('Sem site');
    expect(resolveAutoQualifyDor(undefined)).toBe('Sem site');
    expect(resolveAutoQualifyDor('')).toBe('Sem site');
    expect(resolveAutoQualifyDor('   ')).toBe('Sem site');
  });

  it('maps Instagram profile URLs', () => {
    expect(resolveAutoQualifyDor('https://www.instagram.com/clinica')).toBe('Instagram');
    expect(resolveAutoQualifyDor('HTTP://INSTAGRAM.COM/foo')).toBe('Instagram');
  });

  it('maps Linktree URLs', () => {
    expect(resolveAutoQualifyDor('https://linktr.ee/clinica')).toBe('Linktree');
    expect(resolveAutoQualifyDor('https://LINKTR.EE/foo')).toBe('Linktree');
  });

  it('prefers Instagram when both tokens appear', () => {
    expect(resolveAutoQualifyDor('https://linktr.ee/instagram-promo')).toBe('Instagram');
  });

  it('returns null for regular websites', () => {
    expect(resolveAutoQualifyDor('https://clinica.example')).toBeNull();
  });
});
