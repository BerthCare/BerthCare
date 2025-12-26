import React from 'react';
import { act, render } from '@testing-library/react-native';
import App from './App';
import { palette } from '@ui/palette';

jest.setTimeout(15000);

jest.setTimeout(15000);

const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

const renderApp = async () => {
  const result = render(<App />);
  await act(async () => {
    await flushPromises();
  });
  return result;
};

describe('App', () => {
  it('renders correctly', async () => {
    const { getByPlaceholderText } = await renderApp();

    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('has correct title styling', async () => {
    const { getByTestId } = await renderApp();

    const title = getByTestId('login-title');
    expect(title.props.style).toMatchObject({
      fontSize: 28,
      fontWeight: '700',
      color: palette.textPrimary,
    });
  });

  it('has correct label styling', async () => {
    const { getByText } = await renderApp();

    const subtitle = getByText('Email');
    expect(subtitle.props.style).toMatchObject({
      fontSize: 15,
      color: palette.textSecondary,
      marginBottom: 4,
    });
  });
});
