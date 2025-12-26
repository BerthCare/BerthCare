import React from 'react';
import { act, render } from '@testing-library/react-native';
import App from './App';

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
    const { getByText, getByTestId } = await renderApp();

    expect(getByText('BerthCare')).toBeTruthy();
    expect(getByTestId('auth-status-subtitle')).toHaveTextContent('Signed out');
  });

  it('has correct title styling', async () => {
    const { getByText } = await renderApp();

    const title = getByText('BerthCare');
    expect(title.props.style).toMatchObject({
      fontSize: 32,
      fontWeight: 'bold',
      color: '#1A1A1A',
    });
  });

  it('has correct subtitle styling', async () => {
    const { getByTestId } = await renderApp();

    const subtitle = getByTestId('auth-status-subtitle');
    expect(subtitle.props.style).toMatchObject({
      fontSize: 16,
      color: '#666666',
      marginTop: 8,
    });
  });
});
