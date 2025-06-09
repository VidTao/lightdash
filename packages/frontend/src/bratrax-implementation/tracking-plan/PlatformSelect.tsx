import { Container, Stack, Text, Title } from '@mantine/core';
import PlatformInfoCard from '../cards/PlatformInfoCard';
import PlatformInfoCardContainer from '../containers/PlatformInfoCardContainer';

interface PlatformSelectProps {
    selectedPlatform: string | null;
    onPlatformSelect: (platform: string) => void;
}

const PlatformSelect = ({
    selectedPlatform,
    onPlatformSelect,
}: PlatformSelectProps) => {
    const cards = [
        {
            title: 'Shopify',
            platform: 'shopify',
            subtitle:
                'Track product views, cart actions, and purchases in your Shopify store',
            image: '/images/shopify-logo.webp',
            features: [
                'Product view tracking',
                'Cart abandonment analytics',
                'Purchase conversion tracking',
                'Automatic customer identification',
            ],
        },
        {
            title: 'Go High Level',
            platform: 'ghl',
            subtitle: 'Track leads, form submissions, and campaign performance',
            image: '/images/ghl-logo.svg',
            features: [
                'Lead capture tracking',
                'Form submission analytics',
                'Campaign attribution',
                'Customer journey tracking',
            ],
        },
        {
            title: 'ClickFunnels',
            platform: 'clickfunnels',
            subtitle: 'Track funnel performance, conversions, and user journey',
            image: '/images/cf-logo.png',
            features: [
                'Funnel step tracking',
                'Order form analytics',
                'Funnel completion rates',
                'Revenue attribution',
            ],
        },
    ];

    return (
        <>
            <Container size="lg" my="xl">
                <Stack align="center" spacing="sm">
                    <Title order={1}>Let's set up your tracking plan</Title>
                    <Text size="lg" color="dimmed">
                        First, select the platform you want to track. You can
                        add more platforms later.
                    </Text>
                </Stack>
            </Container>
            <PlatformInfoCardContainer>
                {cards.map((card, index) => (
                    <PlatformInfoCard
                        key={index}
                        title={card.title}
                        subtitle={card.subtitle}
                        image={card.image}
                        items={card.features}
                        isSelected={selectedPlatform === card.platform}
                        onClick={() => onPlatformSelect(card.platform)}
                    />
                ))}
            </PlatformInfoCardContainer>
        </>
    );
};

export default PlatformSelect;
