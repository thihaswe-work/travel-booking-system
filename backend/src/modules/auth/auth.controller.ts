import { Request, Response } from 'express';
import { config } from '../../config';
import * as authService from './auth.service';
import { generateCsrfToken, setCsrfCookie, clearCsrfCookie } from '../../middleware/csrf';

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: config.jwt.refreshExpiresIn * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  setRefreshCookie(res, result.refreshToken);
  const csrfToken = generateCsrfToken();
  setCsrfCookie(res, csrfToken);
  res.status(201).json({ success: true, data: { user: result.user, accessToken: result.accessToken, csrfToken } });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  setRefreshCookie(res, result.refreshToken);
  const csrfToken = generateCsrfToken();
  setCsrfCookie(res, csrfToken);
  res.json({ success: true, data: { user: result.user, accessToken: result.accessToken, csrfToken } });
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user?.id) {
    await authService.logout(req.user.id);
  }
  clearRefreshCookie(res);
  clearCsrfCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) {
    res.status(400).json({ success: false, message: 'Refresh token is required' });
    return;
  }
  const result = await authService.refreshTokens(refreshToken);
  setRefreshCookie(res, result.refreshToken);
  const csrfToken = generateCsrfToken();
  setCsrfCookie(res, csrfToken);
  res.json({ success: true, data: { accessToken: result.accessToken, csrfToken } });
}
