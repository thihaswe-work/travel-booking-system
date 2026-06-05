import crypto from 'crypto';

function generateRandomString(length: number): string {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .toUpperCase()
    .slice(0, length);
}

function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function generateReferenceId(): string {
  return `TBK-${getDateString()}-${generateRandomString(8)}`;
}

export function generateInvoiceNumber(): string {
  return `INV-${getDateString()}-${generateRandomString(8)}`;
}
