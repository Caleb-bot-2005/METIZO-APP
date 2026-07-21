import { TextStyle } from 'react-native';

type TypeScale =
  | 'display'
  | 'headingXl'
  | 'headingL'
  | 'headingM'
  | 'bodyLarge'
  | 'body'
  | 'caption'
  | 'button';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

export const typography: Record<TypeScale, TextStyle> = {
  display: { fontFamily: fontFamily.extrabold, fontSize: 40, lineHeight: 46, letterSpacing: -0.5 },
  headingXl: { fontFamily: fontFamily.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.3 },
  headingL: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30 },
  headingM: { fontFamily: fontFamily.semibold, fontSize: 18, lineHeight: 24 },
  bodyLarge: { fontFamily: fontFamily.regular, fontSize: 17, lineHeight: 25 },
  body: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 20 },
};
