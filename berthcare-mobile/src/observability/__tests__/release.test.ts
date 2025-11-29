import { APP_IDENTIFIER, buildSentryRelease } from '../release';

describe('release builder', () => {
  it('builds consistent release strings with and without git sha', () => {
    const base = buildSentryRelease('1.2.3', '42');
    const withSha = buildSentryRelease('1.2.3', '42', 'abcdef123456');

    expect(base).toBe(`${APP_IDENTIFIER}@1.2.3+42`);
    expect(withSha).toBe(`${APP_IDENTIFIER}@1.2.3+42-abcdef1`);
  });

  it('handles numeric build numbers', () => {
    const release = buildSentryRelease('2.0.0', 7);
    expect(release).toBe(`${APP_IDENTIFIER}@2.0.0+7`);
  });
});
