import { Container, SimpleGrid } from '@mantine/core';
import React from 'react';

const PlatformInfoCardContainer = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return (
        <Container size="xl" mt={48}>
            <SimpleGrid
                cols={3}
                spacing="xl"
                breakpoints={[
                    { maxWidth: 'md', cols: 2, spacing: 'md' },
                    { maxWidth: 'sm', cols: 1, spacing: 'sm' },
                ]}
                sx={{
                    alignItems: 'stretch',
                }}
            >
                {children}
            </SimpleGrid>
        </Container>
    );
};

export default PlatformInfoCardContainer;
