import { Box, Flex, Link, Text } from "@chakra-ui/react";
import { ROUTES } from "@router/routes";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

interface GlobalShellProps {
  children: ReactNode;
}

export function GlobalShell({ children }: GlobalShellProps) {
  return (
    <Box minH="100vh" bg="gray.50">
      {/* ── Top navigation bar ── */}
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        px={6}
        h="56px"
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        position="sticky"
        top={0}
        zIndex="banner"
      >
        <Text fontWeight="bold" fontSize="lg">
          MyApp
        </Text>
        <Flex gap={6}>
          {/* Chakra v3 uses asChild for polymorphic rendering instead of the `as` prop */}
          <Link asChild fontSize="sm">
            <RouterLink to={ROUTES.DASHBOARD.ROOT}>Dashboard</RouterLink>
          </Link>
          <Link asChild fontSize="sm">
            <RouterLink to={ROUTES.AUTH.LOGIN}>Login</RouterLink>
          </Link>
        </Flex>
      </Flex>

      {/* ── Page content ── */}
      <Box as="main" p={6}>
        {children}
      </Box>
    </Box>
  );
}
