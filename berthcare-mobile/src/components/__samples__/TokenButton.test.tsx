import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import { TokenButton } from './TokenButton';
import { colors, spacing, typography } from '@/theme/tokens';

describe('TokenButton', () => {
  it('derives its styles from the token module', () => {
    const { getByRole, getByText } = render(<TokenButton label="Submit" />);

    const button = getByRole('button');
    const styleProp = button.props.style;
    const computedStyle = typeof styleProp === 'function' ? styleProp({ pressed: false }) : styleProp;

    const buttonStyles = StyleSheet.flatten(computedStyle);
    expect(buttonStyles.backgroundColor).toBe(colors.brand.primary);
    expect(buttonStyles.paddingVertical).toBeCloseTo(parseFloat(spacing.md));
    expect(buttonStyles.paddingHorizontal).toBeCloseTo(parseFloat(spacing.md));
    expect(buttonStyles.borderRadius).toBeCloseTo(parseFloat(spacing.sm));

    const label = getByText('Submit');
    const labelStyles = StyleSheet.flatten(label.props.style);
    expect(labelStyles.color).toBe(colors.text.inverse.light);
    expect(labelStyles.fontSize).toBeCloseTo(parseFloat(typography.button.default.size));
    expect(labelStyles.fontWeight).toBe(typography.button.default.weight);
    expect(labelStyles.lineHeight).toBeCloseTo(parseFloat(typography.button.default.lineHeight));
  });
});
