import { Box, Container, Title, Text, Stack } from '@mantine/core';

const TermsOfService = () => {
  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
        <Title order={1}>Terms of Service</Title>

        <Box component="section">
          <Title order={2} mb="md">1. Acceptance of Terms</Title>
          <Text>
            By accessing and using this platform, you accept and agree to be bound by the terms
            and provision of this agreement.
          </Text>
        </Box>

        <Box component="section">
          <Title order={2} mb="md">2. Use License</Title>
          <Text>
            Permission is granted to temporarily download one copy of the materials
            (information or software) on this platform for personal, non-commercial
            transitory viewing only.
          </Text>
        </Box>

        <Box component="section">
          <Title order={2} mb="md">3. Disclaimer</Title>
          <Text>
            The materials on this platform are provided on an 'as is' basis. We make no
            warranties, expressed or implied, and hereby disclaim and negate all other
            warranties including, without limitation, implied warranties or conditions of
            merchantability, fitness for a particular purpose, or non-infringement of
            intellectual property or other violation of rights.
          </Text>
        </Box>

        <Box component="section">
          <Title order={2} mb="md">4. Limitations</Title>
          <Text>
            In no event shall we or our suppliers be liable for any damages (including,
            without limitation, damages for loss of data or profit, or due to business
            interruption) arising out of the use or inability to use the materials on this
            platform.
          </Text>
        </Box>
      </Stack>
    </Container>
  );
};

export default TermsOfService; 