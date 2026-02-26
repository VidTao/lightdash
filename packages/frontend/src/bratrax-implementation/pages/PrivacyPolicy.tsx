import { Box, Container, Title, Text, List, Stack } from '@mantine/core';

const PrivacyPolicy = () => {
  return (
    <Container size="lg" py="xl">
      <Stack spacing="xl">
        <Title order={1}>Privacy Policy</Title>

        <Box component="section">
          <Title order={2} mb="md">Data Collection and Usage</Title>
          <Text mb="md">
            We collect and process data from various platforms to provide
            analytics and reporting services. This includes:
          </Text>
          <List>
            <List.Item>Platform integration data</List.Item>
            <List.Item>Usage statistics and metrics</List.Item>
            <List.Item>Performance analytics</List.Item>
            <List.Item>User interaction data</List.Item>
          </List>
        </Box>

        <Box component="section">
          <Title order={2} mb="md">Data Protection</Title>
          <Text>
            We implement industry-standard security measures to protect your
            data. All collected information is encrypted and stored securely. We
            do not share your data with third parties without explicit consent.
          </Text>
        </Box>

        <Box component="section">
          <Title order={2} mb="md">Google User Data Access</Title>
          <Text mb="md">
            Our application accesses the following Google user data:
          </Text>
          <List>
            <List.Item>User profile information (name, email)</List.Item>
            <List.Item>Google Ads data (campaigns, ads, performance metrics) required for reporting and analytics</List.Item>
            <List.Item>Google Analytics 4 data (website traffic, user behavior, acquisition channels, conversions, and audience demographics) accessed via the Analytics Data API and Admin API for read-only reporting and dashboard creation</List.Item>
          </List>
          <Text mt="md" size="sm">
            Google Ads data is accessed using the Google Ads API scope. Google Analytics 4 data is accessed using the Google Analytics readonly scope. Both are used solely for generating reports and dashboards within the Bratrax platform. We do not modify, delete, or write any data back to your Google accounts.
          </Text>
        </Box>

        <Box component="section">
          <Title order={2} mb="md">Data Sharing and Disclosure</Title>
          <Text mb="md">
            We may share your Google user data with the following entities:
          </Text>
          <List>
            <List.Item>Service providers who assist us in delivering our services</List.Item>
            <List.Item>Third parties for analytics and reporting purposes</List.Item>
          </List>
        </Box>

        <Box component="section">
          <Title order={2} mb="md">Data Retention and Deletion</Title>
          <Text>
            We retain Google user data for as long as necessary to fulfill the purposes outlined in this policy. Users can request deletion of their data at any time, and we will comply in accordance with applicable laws.
          </Text>
        </Box>

        <Box component="section">
          <Title order={2} mb="md">Shopify User Data Access</Title>
          <Text mb="md">
            Our application accesses the following Shopify user data:
          </Text>
          <List>
            <List.Item>Shop information (name)</List.Item>
            <List.Item>Orders, products, customers, inventory and other data related to the shop which is required for reporting and analytics</List.Item>
          </List>
        </Box>

        <Box component="section">
          <Title order={2} mb="md">Data Sharing and Disclosure for Shopify</Title>
          <Text mb="md">
            We may share your Shopify user data with the following entities:
          </Text>
          <List>
            <List.Item>Service providers who assist us in delivering our services</List.Item>
            <List.Item>Third parties for analytics and reporting purposes</List.Item>
          </List>
        </Box>

        <Box component="section">
          <Title order={2} mb="md">Data Retention and Deletion for Shopify</Title>
          <Text>
            We retain Shopify user data for as long as necessary to fulfill the purposes outlined in this policy. Users can request deletion of their data at any time, and we will comply in accordance with applicable laws.
          </Text>
        </Box>
      </Stack>
    </Container>
  );
};

export default PrivacyPolicy;
