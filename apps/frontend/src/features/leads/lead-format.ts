export function formatCnpj(cnpj: string | null): string | null {
  if (!cnpj) return null;
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function formatRating(rating: number | null): string | null {
  return rating === null
    ? null
    : rating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function formatCount(value: number | null): string | null {
  return value === null ? null : value.toLocaleString('pt-BR');
}

export function formatCityState(city: string | null, state: string | null): string | null {
  return [city, state].filter(Boolean).join(' / ') || null;
}
