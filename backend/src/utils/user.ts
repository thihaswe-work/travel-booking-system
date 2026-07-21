export function excludeSensitive<T extends { passwordHash: string; refreshToken?: string | null }>(
  user: T,
): Omit<T, 'passwordHash' | 'refreshToken'> {
  const { passwordHash, refreshToken, ...rest } = user;
  return rest;
}
