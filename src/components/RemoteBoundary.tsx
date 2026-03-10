import { Box, Button, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { Component, type ReactNode, Suspense } from "react";

interface RemoteBoundaryProps {
  /** Display name shown in the loading indicator and error card. */
  name: string;
  children: ReactNode;
  /** Override the default Suspense fallback. */
  fallback?: ReactNode;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
}

// ── Loading fallback ──────────────────────────────────────────────────────────

function LoadingFallback({ name }: { name: string }) {
  return (
    <Flex direction="column" align="center" justify="center" minH="60vh" gap={4}>
      <Spinner size="xl" color="blue.500" borderWidth="4px" />
      <Text color="gray.500" fontSize="sm">
        Loading {name}…
      </Text>
    </Flex>
  );
}

// ── Error fallback ────────────────────────────────────────────────────────────

function ErrorFallback({ name, error }: { name: string; error: Error | null }) {
  return (
    <Flex direction="column" align="center" justify="center" minH="60vh" p={8}>
      <Box
        bg="red.50"
        border="1px solid"
        borderColor="red.200"
        borderRadius="lg"
        p={6}
        maxW="480px"
        w="full"
        textAlign="center"
      >
        <Heading size="md" color="red.600" mb={2}>
          Failed to load {name}
        </Heading>
        <Text color="gray.600" fontSize="sm" mb={6}>
          {error?.message ?? "An unexpected error occurred while loading this module."}
        </Text>
        <Flex gap={3} justify="center">
          <Button
            colorPalette="red"
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Go Home
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
}

// ── Error boundary (must be a class component) ────────────────────────────────

class RemoteErrorBoundary extends Component<{ name: string; children: ReactNode }, ErrorState> {
  constructor(props: { name: string; children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(`[RemoteBoundary:${this.props.name}]`, error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback name={this.props.name} error={this.state.error} />;
    }
    return this.props.children;
  }
}

export function RemoteBoundary({ name, children, fallback }: RemoteBoundaryProps) {
  return (
    <RemoteErrorBoundary name={name}>
      <Suspense fallback={fallback ?? <LoadingFallback name={name} />}>{children}</Suspense>
    </RemoteErrorBoundary>
  );
}
