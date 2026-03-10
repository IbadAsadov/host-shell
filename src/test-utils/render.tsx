import { ChakraProvider } from "@chakra-ui/react";
import { type RenderOptions, type RenderResult, render } from "@testing-library/react";
import { system } from "@theme/index";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";

export * from "@testing-library/react";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  routerProps?: MemoryRouterProps;
}

function AllProviders({
  children,
  routerProps,
}: {
  children: ReactNode;
  routerProps?: MemoryRouterProps;
}) {
  return (
    <ChakraProvider value={system}>
      <MemoryRouter {...routerProps}>{children}</MemoryRouter>
    </ChakraProvider>
  );
}

function customRender(ui: ReactElement, options: CustomRenderOptions = {}): RenderResult {
  const { routerProps, ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => <AllProviders routerProps={routerProps}>{children}</AllProviders>,
    ...renderOptions,
  });
}

export { customRender as render };
