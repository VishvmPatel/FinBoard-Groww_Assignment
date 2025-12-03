import { WidgetField, FieldFormat } from '@/types';

export function formatFieldValue(value: any, field: WidgetField): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  const format = field.format || 'none';
  const numValue = Number(value);

  switch (format) {
    case 'currency':
      const symbol = field.currencySymbol || '$';
      const decimals = field.decimalPlaces !== undefined ? field.decimalPlaces : 2;
      if (isNaN(numValue)) return String(value);
      return `${symbol}${numValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}`;

    case 'percentage':
      const percentDecimals = field.decimalPlaces !== undefined ? field.decimalPlaces : 2;
      if (isNaN(numValue)) return String(value);
      return `${numValue.toLocaleString('en-US', {
        minimumFractionDigits: percentDecimals,
        maximumFractionDigits: percentDecimals,
      })}%`;

    case 'number':
      const numberDecimals = field.decimalPlaces !== undefined ? field.decimalPlaces : 2;
      if (isNaN(numValue)) return String(value);
      return numValue.toLocaleString('en-US', {
        minimumFractionDigits: numberDecimals,
        maximumFractionDigits: numberDecimals,
      });

    case 'date':
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return String(value);
      }

    case 'datetime':
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return String(value);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return String(value);
      }

    case 'none':
    default:
      return String(value);
  }
}

export const formatOptions: { value: FieldFormat; label: string }[] = [
  { value: 'none', label: 'None (Raw)' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
];

export const currencySymbols = [
  { value: '$', label: 'USD ($)' },
  { value: '₹', label: 'INR (₹)' },
  { value: '€', label: 'EUR (€)' },
  { value: '£', label: 'GBP (£)' },
  { value: '¥', label: 'JPY (¥)' },
  { value: '₿', label: 'BTC (₿)' },
];

