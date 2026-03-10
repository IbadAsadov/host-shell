import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";
import { buttonRecipe, cardSlotRecipe } from "./recipes";
import { colors, typography } from "./tokens";

const config = defineConfig({
  cssVarsPrefix: "mf",

  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: colors.brand[50] },
          100: { value: colors.brand[100] },
          200: { value: colors.brand[200] },
          300: { value: colors.brand[300] },
          400: { value: colors.brand[400] },
          500: { value: colors.brand[500] },
          600: { value: colors.brand[600] },
          700: { value: colors.brand[700] },
          800: { value: colors.brand[800] },
          900: { value: colors.brand[900] },
        },
        neutral: {
          50: { value: colors.neutral[50] },
          100: { value: colors.neutral[100] },
          200: { value: colors.neutral[200] },
          300: { value: colors.neutral[300] },
          400: { value: colors.neutral[400] },
          500: { value: colors.neutral[500] },
          600: { value: colors.neutral[600] },
          700: { value: colors.neutral[700] },
          800: { value: colors.neutral[800] },
          900: { value: colors.neutral[900] },
        },
      },
      fonts: {
        heading: { value: typography.fonts.heading },
        body: { value: typography.fonts.body },
        mono: { value: typography.fonts.mono },
      },
    },

    semanticTokens: {
      colors: {
        brand: {
          solid: { value: { base: "{colors.brand.500}", _dark: "{colors.brand.400}" } },
          contrast: { value: { base: "white", _dark: "white" } },
          fg: { value: { base: "{colors.brand.700}", _dark: "{colors.brand.300}" } },
          muted: { value: { base: "{colors.brand.100}", _dark: "{colors.brand.900}" } },
          subtle: { value: { base: "{colors.brand.200}", _dark: "{colors.brand.800}" } },
          emphasized: { value: { base: "{colors.brand.300}", _dark: "{colors.brand.700}" } },
          focusRing: { value: { base: "{colors.brand.500}", _dark: "{colors.brand.400}" } },
        },
      },
    },

    recipes: {
      button: buttonRecipe,
    },
    slotRecipes: {
      card: cardSlotRecipe,
    },
  },
});

export const system = createSystem(defaultConfig, config);

declare module "@chakra-ui/react" {
  interface Register {
    config: typeof system;
  }
}
