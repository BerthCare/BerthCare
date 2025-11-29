import fs from 'node:fs';
import path from 'node:path';

type FlatTokenMap = Record<string, unknown>;

const projectRoot = path.resolve(__dirname, '..', '..');
const sourcePath = path.resolve(
  projectRoot,
  '..',
  'design-documentation',
  'assets',
  'design-tokens.json'
);
const generatedPath = path.resolve(projectRoot, 'src', 'theme', 'generated', 'tokens.raw.json');

const isValueLeaf = (node: unknown): node is { value: unknown } =>
  Boolean(node && typeof node === 'object' && 'value' in (node as Record<string, unknown>));

function flattenValues(node: unknown, prefix = '', acc: FlatTokenMap = {}): FlatTokenMap {
  if (isValueLeaf(node)) {
    acc[prefix] = node.value;
    return acc;
  }

  if (node === null || typeof node !== 'object') {
    acc[prefix] = node;
    return acc;
  }

  for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    flattenValues(child, nextPrefix, acc);
  }

  return acc;
}

describe('tokens parity: design source matches generated output', () => {
  it('preserves all token paths and values', () => {
    const designTokens = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const generatedTokens = JSON.parse(fs.readFileSync(generatedPath, 'utf8'));

    const flattenedDesign = flattenValues(designTokens);
    const flattenedGenerated = flattenValues(generatedTokens);

    expect(Object.keys(flattenedGenerated).sort()).toEqual(Object.keys(flattenedDesign).sort());

    for (const [tokenPath, sourceValue] of Object.entries(flattenedDesign)) {
      expect(flattenedGenerated[tokenPath]).toEqual(sourceValue);
    }
  });
});
