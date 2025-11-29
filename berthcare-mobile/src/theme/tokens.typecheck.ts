/* eslint-disable @typescript-eslint/no-unused-vars */
import { animations, colors, spacing, typography } from './tokens';

type IsAny<T> = 0 extends 1 & T ? true : false;
type AssertNotAny<T> = IsAny<T> extends true ? never : T;

type _ColorsAreTyped = AssertNotAny<typeof colors>;
type _SpacingIsTyped = AssertNotAny<typeof spacing>;
type _TypographyIsTyped = AssertNotAny<typeof typography>;
type _AnimationsAreTyped = AssertNotAny<typeof animations>;

const primary = colors.brand.primary;
const mediumSpacing = spacing.md;
const buttonSize = typography.button.default.size;
const defaultAnimation = animations.default;

// @ts-expect-error invalid color path should not compile
const missingColor = colors.brand.missing;
// @ts-expect-error invalid spacing path should not compile
const missingSpacing = spacing.xxxl;
// @ts-expect-error invalid typography path should not compile
const missingTypography = typography.heading.hero.size;
// @ts-expect-error invalid animation path should not compile
const missingAnimation = animations.duration;

export {};
