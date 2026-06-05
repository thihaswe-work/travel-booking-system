import jwt from 'jsonwebtoken';
import { config } from '../config';

export function generateAccessToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

export function generateRefreshToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

export function verifyAccessToken(token: string): { id: string; email: string; role: string } {
  return jwt.verify(token, config.jwt.secret) as { id: string; email: string; role: string };
}

export function verifyRefreshToken(token: string): { id: string; email: string; role: string } {
  return jwt.verify(token, config.jwt.refreshSecret) as { id: string; email: string; role: string };
}
