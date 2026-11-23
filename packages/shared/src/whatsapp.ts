/**
 * Prefer an explicit WhatsApp URL; otherwise build wa.me from phone digits only.
 */
export function resolveWhatsappLink(
  whatsappUrl: string | null | undefined,
  phone: string | null | undefined,
): string | null {
  const url = whatsappUrl?.trim();
  if (url) {
    return url;
  }
  if (!phone) {
    return null;
  }
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return null;
  }
  return `https://wa.me/${digits}`;
}
