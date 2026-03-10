import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minH="60vh"
      textAlign="center"
      p={8}
      gap={4}
    >
      <Heading fontSize="9xl" fontWeight="extrabold" color="gray.200" lineHeight="1">
        404
      </Heading>
      <Heading size="lg">Page not found</Heading>
      <Text color="gray.500" maxW="400px">
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <Button colorPalette="blue" mt={2} onClick={() => navigate("/")}>
        Go Home
      </Button>
    </Flex>
  );
}
