import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OfflineGraceBanner from '@/components/OfflineGraceBanner';

describe('OfflineGraceBanner', () => {
  it('renders message and calls onDismiss when dismissed', () => {
    const onDismiss = jest.fn();
    const { getByText, getByAccessibilityLabel } = render(
      <OfflineGraceBanner visible={true} onDismiss={onDismiss} />
    );

    expect(getByText('Connect to internet to continue')).toBeTruthy();

    const dismissButton = getByText('Dismiss');
    fireEvent.press(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render when visible is false', () => {
    const onDismiss = jest.fn();
    const { queryByText } = render(<OfflineGraceBanner visible={false} onDismiss={onDismiss} />);
    expect(queryByText('Connect to internet to continue')).toBeNull();
  });
});
