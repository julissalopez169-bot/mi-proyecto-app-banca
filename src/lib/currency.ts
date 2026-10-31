/**
 * Currency utilities for Honduras Lempiras (HNL - L.)
 */

export const CURRENCY_SYMBOL = 'L.';
export const CURRENCY_CODE = 'HNL';

export const formatLempiras = (amount: number | undefined | null, includeSymbol: boolean = true): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return includeSymbol ? 'L. 0.00' : '0.00';
  }
  
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  
  const formatted = absVal.toLocaleString('es-HN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (!includeSymbol) {
    return isNegative ? `-${formatted}` : formatted;
  }

  return isNegative ? `-L. ${formatted}` : `L. ${formatted}`;
};

export const formatHNL = formatLempiras;
