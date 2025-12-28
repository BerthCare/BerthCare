import { palette } from '@ui/palette';

export type ButtonVariant = 'primary' | 'secondary';

type ButtonStateArgs = {
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  brandColor: string;
};

export const getButtonState = ({
  variant = 'primary',
  disabled = false,
  loading = false,
  brandColor,
}: ButtonStateArgs) => {
  const isDisabled = disabled || loading;
  const showDisabledStyle = disabled && !loading;
  const indicatorColor = variant === 'primary' ? palette.textInverse : brandColor;

  return { isDisabled, showDisabledStyle, indicatorColor };
};
