import { ChakraProvider } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { system } from "./index";

interface AppThemeProviderProps {
  children: ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
