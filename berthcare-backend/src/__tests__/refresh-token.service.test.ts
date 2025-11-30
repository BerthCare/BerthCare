/* eslint-disable @typescript-eslint/unbound-method */
import { createHash } from 'crypto';
import { RefreshTokenService } from '../services/refresh-token-service';
import { signRefreshToken } from '../lib/jwt';
import type {
  RefreshTokenRepository,
  UpsertRefreshTokenInput,
} from '../repositories/refresh-token';

jest.mock('../lib/jwt', () => ({
  signRefreshToken: jest.fn(),
}));

const mockRepo = {
  upsertForDevice: jest.fn(),
  findValidByJti: jest.fn(),
  markRevoked: jest.fn(),
  touchLastUsed: jest.fn(),
  revokeByDevice: jest.fn(),
  revokeAllForUser: jest.fn(),
} as unknown as RefreshTokenRepository;

describe('RefreshTokenService', () => {
  const service = new RefreshTokenService(mockRepo);
  const mockedSignRefreshToken = signRefreshToken as jest.MockedFunction<typeof signRefreshToken>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-02T00:00:00Z'));
    jest.clearAllMocks();
    mockedSignRefreshToken.mockResolvedValue({
      token: 'opaque-refresh-token',
      expiresAt: new Date('2025-02-01T00:00:00Z'),
      claims: { sub: 'user', deviceId: 'device', jti: 'provided-jti' },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates and stores a device-bound refresh token with hashed value', async () => {
    const result = await service.createRefreshToken('user-1', 'device-1');

    expect(signRefreshToken).toHaveBeenCalledWith('user-1', 'device-1', expect.any(String));

    const expectedHash = createHash('sha256').update('opaque-refresh-token').digest('hex');
    const expectedPayload: Partial<UpsertRefreshTokenInput> = {
      userId: 'user-1',
      deviceId: 'device-1',
      tokenHash: expectedHash,
      issuedAt: new Date('2025-01-02T00:00:00.000Z'),
      expiresAt: new Date('2025-02-01T00:00:00.000Z'),
    };
    expect(mockRepo.upsertForDevice).toHaveBeenCalledWith(expect.objectContaining(expectedPayload));

    expect(result.refreshToken).toBe('opaque-refresh-token');
    expect(result.expiresAt.toISOString()).toBe('2025-02-01T00:00:00.000Z');
    expect(typeof result.jti).toBe('string');
  });

  it('revokes tokens for a device', async () => {
    const revokeByDevice = jest.spyOn(mockRepo, 'revokeByDevice').mockResolvedValue(2);
    const count = await service.revokeForDevice('user-1', 'device-1');
    expect(count).toBe(2);
    expect(revokeByDevice).toHaveBeenCalledWith('user-1', 'device-1');
  });

  it('revokes all tokens for a user', async () => {
    const revokeAllForUser = jest.spyOn(mockRepo, 'revokeAllForUser').mockResolvedValue(5);
    const count = await service.revokeAllForUser('user-1');
    expect(count).toBe(5);
    expect(revokeAllForUser).toHaveBeenCalledWith('user-1');
  });
});
