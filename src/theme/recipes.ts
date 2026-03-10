import { defineRecipe, defineSlotRecipe } from "@chakra-ui/react";

export const buttonRecipe = defineRecipe({
  base: {
    fontWeight: "semibold",
    transition: "all 0.15s",
    _active: { transform: "scale(0.97)" },
  },
  variants: {
    variant: {
      danger: {
        bg: "error.main",
        color: "white",
        _hover: { bg: "error.dark" },
        _active: { bg: "error.dark" },
      },
    },
  },
  defaultVariants: {
    colorPalette: "blue",
  },
});

export const cardSlotRecipe = defineSlotRecipe({
  slots: ["root", "header", "body", "footer"],
  base: {
    root: {
      borderRadius: "xl",
      boxShadow: "sm",
      borderWidth: "1px",
      borderColor: "neutral.200",
      bg: "white",
      overflow: "hidden",
    },
    header: { px: "5", pt: "5", pb: "2" },
    body: { px: "5", py: "4" },
    footer: { px: "5", pb: "5" },
  },
});
