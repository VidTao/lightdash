import { Box, Stack } from '@mantine/core';
import React from 'react';

interface SkeletonProps {
    count?: number;
    height?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ count = 1, height = 20 }) => {
    return (
        <Stack spacing="xs" sx={{ width: '100%' }}>
            {[...Array(count)].map((_, index) => (
                <Box
                    key={index}
                    sx={(theme) => ({
                        height: height,
                        width: '100%',
                        backgroundColor: theme.colors.gray[2],
                        borderRadius: theme.radius.sm,
                        animation:
                            'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.5 },
                        },
                    })}
                />
            ))}
        </Stack>
    );
};

export default Skeleton;
