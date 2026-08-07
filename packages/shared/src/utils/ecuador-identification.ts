import { IdentificationType } from '../enums/identification-type.enum';

export function normalizeEcuadorIdentification(value: string): string {
  return value.replace(/\D/g, '');
}

function sumWithCoefficients(values: number[], coefficients: number[]): number {
  return values.reduce((sum, digit, index) => {
    const product = digit * coefficients[index];
    return sum + (product >= 10 ? product - 9 : product);
  }, 0);
}

function getCedulaCheckDigit(base9Digits: string): number {
  const digits = base9Digits.split('').map(Number);
  const sum = sumWithCoefficients(digits, [2, 1, 2, 1, 2, 1, 2, 1, 2]);
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

function getPublicRucCheckDigit(base8Digits: string): number {
  const digits = base8Digits.split('').map(Number);
  const sum = sumWithCoefficients(digits, [3, 2, 7, 6, 5, 4, 3, 2]);
  const mod = sum % 11;
  const verifier = 11 - mod;
  if (verifier === 11) return 0;
  if (verifier === 10) return -1;
  return verifier;
}

function getPrivateRucCheckDigit(base9Digits: string): number {
  const digits = base9Digits.split('').map(Number);
  const sum = sumWithCoefficients(digits, [4, 3, 2, 7, 6, 5, 4, 3, 2]);
  const mod = sum % 11;
  const verifier = 11 - mod;
  if (verifier === 11) return 0;
  if (verifier === 10) return -1;
  return verifier;
}

export function isValidEcuadorCedula(value: string): boolean {
  const digits = normalizeEcuadorIdentification(value);
  if (!/^\d{10}$/.test(digits)) return false;

  const province = Number(digits.slice(0, 2));
  const thirdDigit = Number(digits[2]);
  if (province < 1 || province > 24 || thirdDigit >= 6) return false;

  const checkDigit = getCedulaCheckDigit(digits.slice(0, 9));
  return Number(digits[9]) === checkDigit;
}

export function isValidEcuadorRuc(value: string): boolean {
  const digits = normalizeEcuadorIdentification(value);
  if (!/^\d{13}$/.test(digits)) return false;

  const province = Number(digits.slice(0, 2));
  const thirdDigit = Number(digits[2]);
  if (province < 1 || province > 24) return false;

  if (thirdDigit >= 0 && thirdDigit <= 5) {
    return digits.slice(10) === '001' && isValidEcuadorCedula(digits.slice(0, 10));
  }

  if (thirdDigit === 6) {
    if (digits.slice(9) !== '0001') return false;
    const checkDigit = getPublicRucCheckDigit(digits.slice(0, 8));
    return checkDigit >= 0 && Number(digits[8]) === checkDigit;
  }

  if (thirdDigit === 9) {
    if (digits.slice(10) !== '001') return false;
    const checkDigit = getPrivateRucCheckDigit(digits.slice(0, 9));
    return checkDigit >= 0 && Number(digits[9]) === checkDigit;
  }

  return false;
}

export function isValidEcuadorIdentification(type: IdentificationType, value: string): boolean {
  const normalized = normalizeEcuadorIdentification(value);
  if (type === IdentificationType.CEDULA) return isValidEcuadorCedula(normalized);
  if (type === IdentificationType.RUC) return isValidEcuadorRuc(normalized);
  return false;
}
