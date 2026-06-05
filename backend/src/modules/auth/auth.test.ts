import request from 'supertest';

const noopMiddleware = (_req: any, _res: any, next: any) => next();

jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: noopMiddleware,
  generalLimiter: noopMiddleware,
}));

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

jest.mock('../../utils/password', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock('../../utils/jwt', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

const { hashPassword, comparePassword } = jest.requireMock('../../utils/password');
const { generateAccessToken, generateRefreshToken } = jest.requireMock('../../utils/jwt');

import app from '../../app';

const baseUser = {
  id: 'user_1',
  email: 'test@example.com',
  passwordHash: 'hashed_password_123',
  firstName: 'John',
  lastName: 'Doe',
  phone: null,
  role: 'customer' as const,
  isActive: true,
  refreshToken: null,
  preferences: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user successfully', async () => {
    hashPassword.mockResolvedValue('hashed_password_123');
    generateAccessToken.mockReturnValue('access_token_123');
    generateRefreshToken.mockReturnValue('refresh_token_123');
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(baseUser);
    mockPrisma.user.update.mockResolvedValue({ ...baseUser, refreshToken: 'refresh_token_123' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'Passw0rd!', firstName: 'John', lastName: 'Doe' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(res.body.data.accessToken).toBe('access_token_123');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('refreshToken');
  });

  it('should return 409 when email already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'Passw0rd!', firstName: 'John', lastName: 'Doe' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'Ab1!', firstName: 'John', lastName: 'Doe' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when password lacks uppercase', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'password1!', firstName: 'John', lastName: 'Doe' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when password lacks number', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'Password!', firstName: 'John', lastName: 'Doe' });

    expect(res.status).toBe(400);
  });

  it('should return 400 when password lacks special character', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'Password1', firstName: 'John', lastName: 'Doe' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('should login successfully with valid credentials', async () => {
    comparePassword.mockResolvedValue(true);
    generateAccessToken.mockReturnValue('access_token_456');
    generateRefreshToken.mockReturnValue('refresh_token_456');
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);
    mockPrisma.user.update.mockResolvedValue({ ...baseUser, refreshToken: 'refresh_token_456' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Passw0rd!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.accessToken).toBe('access_token_456');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should return 401 when password is wrong', async () => {
    comparePassword.mockResolvedValue(false);
    mockPrisma.user.findUnique.mockResolvedValue(baseUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPass1!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when user is inactive', async () => {
    comparePassword.mockResolvedValue(true);
    mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, isActive: false });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Passw0rd!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when email does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'Passw0rd!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
