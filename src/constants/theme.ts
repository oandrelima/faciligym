// FaciliGym — White Mode / Light Theme
export const Theme = {
  colors: {
    // Whites & Grays
    bg: '#FFFFFF',
    bgPage: '#F5F5F5',
    bgCard: '#FFFFFF',
    bgCardAlt: '#F8F8F8',
    bgInput: '#F2F2F2',
    bgInputFocus: '#EBEBEB',
    border: 'rgba(0,0,0,0.07)',
    shadow: 'rgba(0,0,0,0.08)',

    // Red Accent (from reference)
    red: '#E8354A',
    redLight: '#FF5A6E',
    redDim: 'rgba(232, 53, 74, 0.1)',
    redBorder: 'rgba(232, 53, 74, 0.25)',

    // Tab bar & dark elements
    dark: '#111111',
    darkCard: '#1A1A1A',

    // Text
    textPrimary: '#111111',
    textSecondary: '#888888',
    textMuted: '#BBBBBB',
    textInverse: '#FFFFFF',
    textOnRed: '#FFFFFF',

    // Category colors
    cat1: '#FFF0F2',
    cat2: '#F0F0FF',
    cat3: '#F0FFF4',
    cat4: '#FFF8F0',
  },

  spacing: { xs: 4, sm: 10, md: 16, lg: 24, xl: 36 },

  radius: {
    xs: 8,
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
    full: 9999,
  },

  font: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 24,
    xxl: 32,
    hero: 42,
  },

  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 3,
    },
    strong: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 6,
    },
  },
};

export const Colors = {
  light: { text: '#111', background: '#fff', tint: Theme.colors.red },
  dark:  { text: '#fff', background: '#111', tint: Theme.colors.red },
};
export const Spacing = Theme.spacing;
export const Fonts = {
  sans: 'Plus Jakarta Sans, Outfit, -apple-system, BlinkMacSystemFont, sans-serif',
  mono: 'Courier',
};
export const ThemeColor = Theme.colors;
export const BottomTabInset = 60;
export const MaxContentWidth = 600;
