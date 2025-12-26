import type { LoginResult } from '../../services/auth';

export class FakeAuthService {
  login(): Promise<LoginResult> {
    return Promise.resolve({
      accessToken: 'access-token',
      accessExpiresAt: new Date(Date.now() + 1000),
      refreshToken: 'refresh-token',
      refreshExpiresAt: new Date(Date.now() + 2000),
      userId: 'cg-1',
      deviceId: '11111111-1111-4111-8111-111111111111',
      jti: 'jti-1',
    });
  }

  refresh(): Promise<LoginResult> {
    return Promise.resolve({
      accessToken: 'new-access-token',
      accessExpiresAt: new Date(Date.now() + 1000),
      refreshToken: 'new-refresh-token',
      refreshExpiresAt: new Date(Date.now() + 2000),
      userId: 'cg-1',
      deviceId: '11111111-1111-4111-8111-111111111111',
      jti: 'jti-2',
    });
  }
}
