/** Pain-point names expected in the catalog for campaign auto-qualification. */
export const AUTO_QUALIFY_PAIN_POINT_NAMES = ['Sem site', 'Instagram', 'Linktree'] as const;
export type AutoQualifyPainPointName = (typeof AUTO_QUALIFY_PAIN_POINT_NAMES)[number];

/**
 * Infers auto-qualification from the website Google returned for the place.
 * No URL → Sem site; Instagram / Linktree profile URLs → matching pain point.
 */
export function resolveAutoQualifyPainPoint(
  website: string | null | undefined,
): AutoQualifyPainPointName | null {
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
