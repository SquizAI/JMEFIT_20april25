export function calculateYearlyPrice(monthlyPrice: number): number {
  const yearlyPrice = monthlyPrice * 12;
  const discount = yearlyPrice * 0.2; // 20% discount
  return yearlyPrice - discount;
}

export function formatPrice(price: number, interval: 'month' | 'year'): string {
  return `$${price.toFixed(2)}/${interval === 'year' ? 'year' : 'month'}`;
}

export function parsePrice(priceString: string): number {
  return parseFloat(priceString.replace(/[^0-9.]/g, ''));
}