export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rateVsUSD?: number;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka (BDT)', flag: '🇧🇩' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', flag: '🇬🇧' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', flag: '🇮🇳' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal (SAR)', flag: '🇸🇦' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (AED)', flag: '🇦🇪' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD)', flag: '🇦🇺' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit (MYR)', flag: '🇲🇾' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD)', flag: '🇸🇬' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)', flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan (CNY)', flag: '🇨🇳' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee (PKR)', flag: '🇵🇰' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira (TRY)', flag: '🇹🇷' },
];

export const formatMoney = (
  amount: number | string | undefined | null,
  symbol: string = '$',
  decimals: number = 2
): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0') || 0;
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};
