import generatedTokens from './generated/tokens';

export const colors = generatedTokens.color;
export const spacing = generatedTokens.space;
export const typography = generatedTokens.type;
export const animations = generatedTokens.motion;

export type ColorTokens = typeof colors;
export type SpacingTokens = typeof spacing;
export type TypographyTokens = typeof typography;
export type MotionTokens = typeof animations;

export type ThemeTokens = {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  animations: MotionTokens;
};

export const tokens: ThemeTokens = {
  colors,
  spacing,
  typography,
  animations,
};
