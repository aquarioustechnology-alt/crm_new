// src/lib/currency.ts
// Centralized currency utilities for USD/INR conversion and INR formatting

export const USD_TO_INR_RATE = 83;

type MaybeString = string | null | undefined;

type Currency = 'USD' | 'INR' | string | null | undefined;

export function parseNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isFinite(value) ? value : 0;
  const n = parseFloat(String(value));
  return isFinite(n) && !isNaN(n) ? n : 0;
}

export function convertCurrency(value: unknown, from: Currency, to: Currency): number {
  const amount = parseNumber(value);
  const f = (from || '').toString().toUpperCase();
  const t = (to || '').toString().toUpperCase();
  if (!amount) return 0;
  if (f === t) return amount;
  // Only USD and INR supported for now
  if (f === 'USD' && t === 'INR') return amount * USD_TO_INR_RATE;
  if (f === 'INR' && t === 'USD') return amount / USD_TO_INR_RATE;
  // Unknown currency: return the amount unchanged
  return amount;
}

export function toInr(value: unknown, currency: Currency): number {
  return convertCurrency(value, currency, 'INR');
}

export function formatInr(value: unknown): string {
  const num = Math.round(parseNumber(value));
  return '₹' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatCurrency(value: unknown, currency: Currency = 'INR'): string {
  const num = Math.round(parseNumber(value));
  const formattedNum = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  const c = (currency || 'INR').toString().toUpperCase();
  
  if (c === 'USD') {
    return '$' + formattedNum;
  } else if (c === 'INR') {
    return '₹' + formattedNum;
  } else {
    return formattedNum + ' ' + c;
  }
}

