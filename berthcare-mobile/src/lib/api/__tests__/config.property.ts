import fc from 'fast-check';
import { buildUrl } from '../config';

const slugChars = 'abcdefghijklmnopqrstuvwxyz0123456789-'.split('');
const slug = fc.stringOf(fc.constantFrom(...slugChars), { minLength: 1, maxLength: 12 });

const baseUrlArb = fc
  .tuple(slug, slug, fc.array(slug, { maxLength: 2 }), fc.boolean())
  .map(([subdomain, domain, extraSegments, trailingSlash]) => {
    const extra = extraSegments.length ? `/${extraSegments.join('/')}` : '';
    const base = `https://${subdomain}.${domain}.example.com${extra}/api`;
    return trailingSlash ? `${base}/` : base;
  });

const relativePathArb = fc
  .tuple(fc.array(slug, { minLength: 1, maxLength: 3 }), fc.boolean(), fc.boolean())
  .map(([segments, leadingSlash, trailingSlash]) => {
    const core = segments.join('/');
    const withLeading = leadingSlash ? `/${core}` : core;
    return trailingSlash ? `${withLeading}/` : withLeading;
  });

const absolutePathArb = fc
  .tuple(fc.constantFrom('http', 'https'), slug, slug, fc.array(slug, { maxLength: 2 }))
  .map(([scheme, subdomain, domain, segments]) => {
    const extra = segments.length ? `/${segments.join('/')}` : '';
    return `${scheme}://${subdomain}.${domain}.example.com${extra}`;
  });

const pathArb = fc.oneof(relativePathArb, fc.constant(''), fc.constant('   '), absolutePathArb);

describe('Feature: mobile-api-client, Property 1: Base URL prepending consistency', () => {
  it('prepends base URL exactly once with a single separator', () => {
    fc.assert(
      fc.property(baseUrlArb, pathArb, (baseUrl, relativePath) => {
        const result = buildUrl(baseUrl, relativePath);

        if (/^https?:\/\//i.test(relativePath)) {
          expect(result).toBe(relativePath);
          return;
        }

        const normalizedBase = baseUrl.replace(/\/+$/, '');
        const normalizedPath = relativePath.replace(/^\/+/, '');
        const expected = normalizedPath ? `${normalizedBase}/${normalizedPath}` : normalizedBase;

        expect(result).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });
});
