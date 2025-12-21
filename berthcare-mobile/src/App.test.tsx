import React from 'react';
import { render } from '@testing-library/react-native';
import App from './App';

describe('App', () => {
  it('renders correctly', () => {
    const { getByText, getByTestId } = render(<App />);

    expect(getByText('BerthCare')).toBeTruthy();
    expect(getByTestId('auth-status-subtitle')).toHaveTextContent('Signed out');
  });

  it('has correct title styling', () => {
    const { getByText } = render(<App />);

    const title = getByText('BerthCare');
    expect(title.props.style).toMatchObject({
      fontSize: 32,
      fontWeight: 'bold',
      color: '#1A1A1A',
    });
  });

  it('has correct subtitle styling', () => {
    const { getByTestId } = render(<App />);

    const subtitle = getByTestId('auth-status-subtitle');
    expect(subtitle.props.style).toMatchObject({
      fontSize: 16,
      color: '#666666',
      marginTop: 8,
    });
  });
});
