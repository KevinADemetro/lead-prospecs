/** Dor names expected in the catalog for campaign auto-qualification. */
export const AUTO_QUALIFY_DOR_NAMES = ['Sem site', 'Instagram', 'Linktree'] as const;
export type AutoQualifyDorName = (typeof AUTO_QUALIFY_DOR_NAMES)[number];

/**
 * Infers auto-qualification from the website Google returned for the place.
 * No URL → Sem site; Instagram / Linktree profile URLs → matching dor.
 */
export function resolveAutoQualifyDor(
  website: string | null | undefined,
): AutoQualifyDorName | null {
  const value = website?.trim() ?? '';
  if (!value) {
    return 'Sem site';
  }
  const lower = value.toLowerCase();
  if (lower.includes('instagram')) {
    return 'Instagram';
  }
  if (lower.includes('linktr.ee')) {
    return 'Linktree';
  }
  return null;
}
