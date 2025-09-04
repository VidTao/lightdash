import { Box, Loader } from '@mantine/core';

const LoadingSpinner = () => {
    return (
        <Box className="loading-spinner">
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 100000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Loader
                    color="blue.6"
                    size={50}
                    variant="dots" // or "bars", "oval", "dots"
                />
            </Box>
        </Box>
    );
};

export default LoadingSpinner;
