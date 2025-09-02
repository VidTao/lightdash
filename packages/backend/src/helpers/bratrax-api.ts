const axios = require('axios');

// Assuming you have the base API URL configured somewhere
const BRATRAX_API_URL =
    process.env.BRATRAX_API_URL || 'https://api.bratrax.com'; // Update with your actual API URL

/**
 * Get platform credential field for a user
 * @param {string} userId - The user ID
 * @param {string} platform - The platform name (e.g., 'Facebook', 'Google')
 * @param {string} fieldName - The field name to retrieve
 * @returns {Promise<Object>} Response containing fieldName and fieldValue
 */
export const getPlatformCredentials = async (
    userId: string,
) => {
    try {
        const response = await axios.get(
            `${BRATRAX_API_URL}/connectors/platform-credentials`,
            {
                headers: {
                    'user-id': userId,
                    'Content-Type': 'application/json',
                },
            },
        );

        return response.data;
    } catch (error) {
        console.error('Error getting platform credential:', error);
        throw error;
    }
};
