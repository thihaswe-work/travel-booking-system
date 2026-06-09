import crypto from 'crypto';

const KEY_PREFIX = 'ta_';
const KEY_LENGTH = 48;

export function generateApiKey(): { plainKey: string; keyHash: string; keyPrefix: string } {
  const random = crypto.randomBytes(KEY_LENGTH).toString('base64url');
  const plainKey = `${KEY_PREFIX}${random}`;
  const keyHash = hashApiKey(plainKey);
  return { plainKey, keyHash, keyPrefix: KEY_PREFIX };
}

export function hashApiKey(plainKey: string): string {
  return crypto.createHash('sha256').update(plainKey).digest('hex');
}
