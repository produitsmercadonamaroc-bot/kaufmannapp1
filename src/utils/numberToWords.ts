/**
 * Converts numbers into French words for Moroccan invoices:
 * e.g. 27196.11 -> "VINGT-SEPT MILLE CENT QUATRE-VINGT-SEIZE DIRHAMS ET ONZE CENTIMES"
 */

const UNITES = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
const DIZAINES_10 = [
  'DIX',
  'ONZE',
  'DOUZE',
  'TREIZE',
  'QUATORZE',
  'QUINZE',
  'SEIZE',
  'DIX-SEPT',
  'DIX-HUIT',
  'DIX-NEUF',
];
const DIZAINES = [
  '',
  '',
  'VINGT',
  'TRENTE',
  'QUARANTE',
  'CINQUANTE',
  'SOIXANTE',
  'SOIXANTE-DIX',
  'QUATRE-VINGT',
  'QUATRE-VINGT-DIX',
];

function convertLessThanHundred(n: number): string {
  if (n < 10) return UNITES[n];
  if (n >= 10 && n < 20) return DIZAINES_10[n - 10];

  const tens = Math.floor(n / 10);
  const units = n % 10;

  if (tens === 7) {
    if (units === 1) return 'SOIXANTE ET ONZE';
    return `SOIXANTE-${DIZAINES_10[units]}`;
  }

  if (tens === 8) {
    if (units === 0) return 'QUATRE-VINGTS';
    return `QUATRE-VINGT-${UNITES[units]}`;
  }

  if (tens === 9) {
    return `QUATRE-VINGT-${DIZAINES_10[units]}`;
  }

  if (units === 1) {
    return `${DIZAINES[tens]} ET UN`;
  }

  if (units > 0) {
    return `${DIZAINES[tens]}-${UNITES[units]}`;
  }

  return DIZAINES[tens];
}

function convertLessThanThousand(n: number): string {
  if (n === 0) return '';
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  let str = '';
  if (hundreds === 1) {
    str = 'CENT';
  } else if (hundreds > 1) {
    str = `${UNITES[hundreds]} CENT${remainder === 0 ? 'S' : ''}`;
  }

  if (remainder > 0) {
    str = str ? `${str} ${convertLessThanHundred(remainder)}` : convertLessThanHundred(remainder);
  }

  return str;
}

export function numberToFrenchWordsMAD(amount: number): string {
  if (amount === 0) return 'ZERO DIRHAMS';

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const millions = Math.floor(integerPart / 1000000);
  const underThousand = integerPart % 1000;

  const parts: string[] = [];

  if (millions > 0) {
    if (millions === 1) {
      parts.push('UN MILLION');
    } else {
      parts.push(`${convertLessThanThousand(millions)} MILLIONS`);
    }
  }

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push('MILLE');
    } else {
      parts.push(`${convertLessThanThousand(thousands)} MILLE`);
    }
  }

  if (underThousand > 0) {
    parts.push(convertLessThanThousand(underThousand));
  }

  let result = `${parts.join(' ')} DIRHAMS`;

  if (decimalPart > 0) {
    result += ` ET ${convertLessThanHundred(decimalPart)} CENTIMES`;
  }

  return result.replace(/\s+/g, ' ').trim();
}
