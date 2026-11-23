import { resolveWhatsappLink } from '@app/shared';

describe('resolveWhatsappLink', () => {
  it('prefers whatsappUrl when present', () => {
    expect(resolveWhatsappLink('https://wa.me/5511999999999', '11988887777')).toBe(
      'https://wa.me/5511999999999',
    );
  });

  it('builds wa.me from phone digits', () => {
    expect(resolveWhatsappLink(null, '+55 (41) 99999-0000')).toBe('https://wa.me/5541999990000');
  });

  it('returns null when neither is usable', () => {
    expect(resolveWhatsappLink('  ', '')).toBeNull();
    expect(resolveWhatsappLink(null, null)).toBeNull();
  });
});
