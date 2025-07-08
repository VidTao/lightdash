import {
    AdPlatformAccountInfo,
    COGSSettings,
    InviteUserData,
    PaymentGatewaySettings,
    ShippingProfile,
} from '../models/interfaces';
import axiosInstance from '../services/axios';
const axios = axiosInstance;

// const googleAdsApiUrl = "https://googleads.googleapis.com/v12";
// const apiUrl = "http://192.168.100.219:5000";
const apiUrl = "https://api.bratrax.com";
// const apiUrl = 'https://127.0.0.1:5000';
// const apiUrl = "/api"; // This will use the Vite proxy

export class ApiService {
    fbLogin = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            window.FB?.login(
                (response: any) => {
                    if (response.authResponse) {
                        resolve(response);
                    } else {
                        reject(
                            'User cancelled login or did not fully authorize.',
                        );
                    }
                },
                {
                    scope: 'email, ads_read', //ads_management
                },
            );
        });
    };

    getfbUserInfo = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            window.FB?.api('/me', { fields: 'name,email' }, (response: any) => {
                if (response && !response.error) {
                    resolve(response);
                } else {
                    reject(response.error || 'Error fetching user info');
                }
            });
        });
    };

    getfbAdAccounts = (accessToken: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            window.FB?.api(
                '/me/adaccounts',
                { access_token: accessToken, fields: 'account_id,name' },
                (response: any) => {
                    if (response && !response.error) {
                        resolve(response);
                    } else {
                        reject(response.error || 'Error fetching ad accounts');
                    }
                },
            );
        });
    };

    getPinterestAuthUrl = async (): Promise<string> => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/pinterest/auth-url`,
            );
            return response.data.url; // Return the URL from the response
        } catch (error) {
            console.error('Error getting Pinterest auth URL:', error);
            throw error;
        }
    };

    generatePinterestTokensDataAndSaveinBQ = async (
        code: string,
    ): Promise<string> => {
        try {
            const response = await axios.post(
                `${apiUrl}/connectors/pinterest/insertTokensData`,
                { code: code },
            );
            return response.data;
        } catch (error) {
            console.error('Error getting Pinterest tokens data:', error);
            throw error;
        }
    };

    getShopifyAuthUrl = async (): Promise<string> => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/shopify/auth-url`,
            );
            return response.data.url; // Return the URL from the response
        } catch (error) {
            console.error('Error getting Shopify auth URL:', error);
            throw error;
        }
    };

    getShopifyShopAuthUrl = async (shop: string): Promise<string> => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/shopify/shop-auth-url`,
                {
                    params: {
                        shop: shop,
                    },
                },
            );
            return response.data.url; // Return the URL from the response
        } catch (error) {
            console.error('Error getting Shopify auth URL:', error);
            throw error;
        }
    };

    generateShopifyTokensDataAndSaveinBQ = async (
        code: string,
        shop: string,
    ): Promise<string> => {
        try {
            const response = await axios.post(
                `${apiUrl}/connectors/shopify/insertTokensData`,
                { code: code, shop: shop },
            );
            return response.data;
        } catch (error) {
            console.error('Error getting Pinterest tokens data:', error);
            throw error;
        }
    };

    getGoHighLevelAuthUrl = async (): Promise<string> => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/gohighlevel/auth-url`,
            );
            return response.data.url; // Return the URL from the response
        } catch (error) {
            console.error('Error getting Shopify auth URL:', error);
            throw error;
        }
    };

    generateGoHighLevelTokensDataAndSaveinBQ = async (
        code: string,
    ): Promise<string> => {
        try {
            const response = await axios.post(
                `${apiUrl}/connectors/gohighlevel/insertTokensData`,
                { code: code },
            );
            return response.data;
        } catch (error) {
            console.error('Error getting Pinterest tokens data:', error);
            throw error;
        }
    };

    generateFBTokensDataAndSaveinBQ = async (
        shortLivedToken: string,
        email: string,
        selectedAccounts: AdPlatformAccountInfo[],
    ) => {
        const response = await axios.post(
            `${apiUrl}/connectors/facebook/insertTokensData`,
            {
                short_lived_token: shortLivedToken,
                email: email,
                selectedAccounts: selectedAccounts,
            },
        );
        return response.data;
    };

    getAllGoogleManagerAccounts = async (code: any) => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/google/adAccounts`,
                {
                    params: {
                        code: code,
                    },
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Failed to retrieve accessible accounts', error);
        }
    };

    generateGoogleTokensDataAndSaveinBQ = async (
        code: string,
        selectedAccounts: AdPlatformAccountInfo[],
    ) => {
        const response = await axios.post(
            `${apiUrl}/connectors/google/insertTokensData`,
            {
                code: code,
                selectedAccounts: selectedAccounts,
            },
        );
        return response.data;
    };

    getClickFunnel2AuthUrl = async (): Promise<string> => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/clickfunnels2/auth-url`,
            );
            return response.data.url; // Return the URL from the response
        } catch (error) {
            console.error('Error getting ClickFunnel2 auth URL:', error);
            throw error;
        }
    };

    generateClickFunnel2TokensDataAndSaveinBQ = async (code: string) => {
        const response = await axios.post(
            `${apiUrl}/connectors/clickfunnels2/insertTokensData`,
            {
                code: code,
            },
        );
        return response.data;
    };

    getKlaviyoAuthUrl = async (): Promise<string> => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/klaviyo/auth-url`,
            );
            return response.data.url; // Return the URL from the response
        } catch (error) {
            console.error('Error getting Klaviyo auth URL:', error);
            throw error;
        }
    };

    generateKlaviyoTokensDataAndSaveinBQ = async (
        code: string,
        state: string,
    ): Promise<string> => {
        try {
            const response = await axios.post(
                `${apiUrl}/connectors/klaviyo/insertTokensData`,
                { code: code, state: state },
            );
            return response.data;
        } catch (error) {
            console.error('Error getting Pinterest tokens data:', error);
            throw error;
        }
    };

    registerApplicationUser = async (
        userId: string,
        email: string,
        name: string,
    ) => {
        const response = await axios.post(`${apiUrl}/users/register`, {
            user_id: userId,
            email: email,
            name: name,
        });
        return response.data;
    };

    inviteUser = async (values: InviteUserData) => {
        const response = await axios.post(`${apiUrl}/users/invite`, values);
        return response.data;
    };

    checkEmailAvailability = async (email: string) => {
        const response = await axios.get(`${apiUrl}/users/check-email`, {
            params: { email: email },
        });
        return response.data;
    };

    registerClient = async (name: string) => {
        const response = await axios.post(`${apiUrl}/users/register-client`, {
            name: name,
        });
        return response.data;
    };

    getApplicationUser = async () => {
        const response = await axios.get(`${apiUrl}/users`);
        return response.data;
    };

    getAllApplicationUsers = async () => {
        const response = await axios.get(`${apiUrl}/users/all`);
        return response.data;
    };

    getPlatformConnection = async (platformType: string) => {
        const response = await axios.get(
            `${apiUrl}/users/get-platform-connection`,
            {
                params: { platform_type: platformType },
            },
        );
        return response.data;
    };

    getCRMConnections = async (platformType: string) => {
        const response = await axios.get(
            `${apiUrl}/users/get-crm-connections`,
            {
                params: { platform_type: platformType },
            },
        );
        return response.data;
    };

    getAdvertisingConnections = async (platformType: string) => {
        const response = await axios.get(`${apiUrl}/users/get-ad-connections`, {
            params: { platform_type: platformType },
        });
        return response.data;
    };

    getStripeAuthUrl = async (): Promise<string> => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/stripe/auth-url`,
            );
            return response.data.url; // Return the URL from the response
        } catch (error) {
            console.error('Error getting Shopify auth URL:', error);
            throw error;
        }
    };

    generateStripeTokensDataAndSaveinBQ = async (
        code: string,
    ): Promise<string> => {
        try {
            const response = await axios.post(
                `${apiUrl}/connectors/stripe/insertTokensData`,
                { code: code },
            );
            return response.data;
        } catch (error) {
            console.error('Error getting Stripe tokens data:', error);
            throw error;
        }
    };

    getStandardEvents = async (platform: string): Promise<any> => {
        try {
            const response = await axios.get(
                `${apiUrl}/tracking-plan/standard-events`,
                {
                    params: {
                        platform,
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Error getting standard events:', error);
            throw error;
        }
    };

    getProperties = async (): Promise<any> => {
        try {
            const response = await axios.get(
                `${apiUrl}/tracking-plan/properties`,
            );
            return response.data;
        } catch (error) {
            console.error('Error getting properties:', error);
            throw error;
        }
    };

    insertCustomEvent = async (event: any) => {
        try {
            const response = await axios.post(
                `${apiUrl}/tracking-plan/insert-custom-event`,
                event,
            );
            return response.data;
        } catch (error) {
            console.error('Error inserting custom event:', error);
            throw error;
        }
    };

    getGoogleAdsMetrics = async (
        accessToken: string,
        customerId: string,
        managerId?: string,
    ) => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/google/metrics`,
                {
                    params: {
                        access_token: accessToken,
                        customer_id: customerId,
                        manager_id: managerId,
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Failed to retrieve Google Ads metrics', error);
            throw error;
        }
    };

    getGoogleAdsPerformance = async (
        accessToken: string,
        customerId: string,
        dateRange: 'LAST_30_DAYS' | 'LAST_7_DAYS' = 'LAST_7_DAYS',
        managerId?: string,
    ) => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/google/performance`,
                {
                    params: {
                        access_token: accessToken,
                        customer_id: customerId,
                        date_range: dateRange,
                        manager_id: managerId,
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Failed to retrieve Google Ads performance', error);
            throw error;
        }
    };

    verifyDomain = async (
        domain: string,
        expectedValue: string,
    ): Promise<any> => {
        try {
            const response = await axios.post(`${apiUrl}/domain/verify`, {
                domain: domain,
                expected_value: expectedValue,
            });
            return response.data;
        } catch (error) {
            console.error('Error verifying domain:', error);
            throw error;
        }
    };

    getFacebookAdsMetrics = async (accessToken: string): Promise<any> => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/facebook/metrics`,
                {
                    params: {
                        access_token: accessToken,
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Failed to retrieve Facebook Ads metrics', error);
            throw error;
        }
    };

    getFacebookAdsPerformance = async (
        accessToken: string,
        dateRange: 'LAST_30_DAYS' | 'LAST_7_DAYS' = 'LAST_7_DAYS',
    ) => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/facebook/performance`,
                {
                    params: {
                        access_token: accessToken,
                        date_range: dateRange,
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Failed to retrieve Facebook Ads performance', error);
            throw error;
        }
    };

    getShopifyMetrics = async (): Promise<any> => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/shopify/metrics`,
            );
            return response.data;
        } catch (error) {
            console.error('Failed to retrieve Shopify metrics', error);
            throw error;
        }
    };

    getShopifyPerformance = async (
        dateRange: 'LAST_30_DAYS' | 'LAST_7_DAYS' = 'LAST_7_DAYS',
    ) => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/shopify/performance`,
                {
                    params: {
                        date_range: dateRange,
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Failed to retrieve Shopify performance', error);
            throw error;
        }
    };

    getShopifyProducts = async (): Promise<any> => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/shopify/products`,
            );
            return response.data;
        } catch (error) {
            console.error('Failed to retrieve Shopify products', error);
            throw error;
        }
    };

    getAmazonAuthUrl = async (region: string): Promise<string> => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/amazon/auth-url`,
                {
                    params: {
                        region: region,
                    },
                },
            );
            return response.data.url;
        } catch (error) {
            console.error('Error getting Amazon auth URL:', error);
            throw error;
        }
    };

    generateAmazonTokensDataAndSaveinBQ = async (
        code: string,
        region: string,
        sellingPartnerId: string,
    ): Promise<string> => {
        try {
            const response = await axios.post(
                `${apiUrl}/connectors/amazon/insertTokensData`,
                {
                    code,
                    region,
                    selling_partner_id: sellingPartnerId,
                    // seller_url: config.seller_url,
                    // marketplaces: config.marketplaces,
                    // sales_data_granularity: config.sales_data_granularity,
                    // start_date: config.start_date
                },
            );
            return response.data;
        } catch (error) {
            console.error('Error getting Amazon tokens data:', error);
            throw error;
        }
    };

    getAmazonAdsAuthUrl = async (region: string): Promise<string> => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/amazon-ads/auth-url`,
                {
                    params: {
                        region: region,
                    },
                },
            );
            return response.data.url;
        } catch (error) {
            console.error('Error getting Amazon Ads auth URL:', error);
            throw error;
        }
    };

    generateAmazonAdsTokensDataAndSaveinBQ = async (
        code: string,
        state: string,
        region: string,
    ): Promise<string> => {
        try {
            const response = await axios.post(
                `${apiUrl}/connectors/amazon-ads/insertTokensData`,
                {
                    code: code,
                    state: state,
                    region: region,
                },
            );
            return response.data;
        } catch (error) {
            console.error('Error getting Amazon Ads tokens data:', error);
            throw error;
        }
    };

    updateUserRole = async (userId: string, role: string) => {
        const response = await axios.put(`${apiUrl}/users/${userId}/role`, {
            role: role,
        });
        return response.data;
    };

    getStoreCogsSettings = async (platformType: string): Promise<any> => {
        try {
            const response = await axios.get(
                `${apiUrl}/cost-settings/store-cogs`,
                {
                    params: {
                        platform_type: platformType,
                    },
                },
            );
            return response.data; // Return the store COGS settings from the response
        } catch (error) {
            console.error('Error fetching store COGS settings:', error);
            throw error;
        }
    };

    getProductsWithCogsSettings = async (
        platformType: string,
        marketplace: string,
    ): Promise<any> => {
        try {
            const response = await axios.get(
                `${apiUrl}/cost-settings/products-with-cogs`,
                {
                    params: {
                        platform_type: platformType,
                        marketplace: marketplace,
                    },
                },
            );
            return response.data; // Return the combined product and COGS settings data
        } catch (error) {
            console.error('Error fetching products with COGS settings:', error);
            throw error;
        }
    };

    insertShippingProfile = async (
        shippingProfile: ShippingProfile,
    ): Promise<any> => {
        try {
            const response = await axios.post(
                `${apiUrl}/cost-settings/insert-shipping-profile`,
                {
                    write_key: shippingProfile.writeKey,
                    profile_name: shippingProfile.profileName,
                    is_worldwide: shippingProfile.isWorldwide,
                    regions: shippingProfile.regions,
                    rate_type: shippingProfile.rateType,
                    shipping_rate: shippingProfile.shippingRate,
                    weight_tiers: shippingProfile.weightTiers,
                    fulfillment_methods: shippingProfile.fulfillmentMethods,
                },
            );
            return response.data; // Return the response data
        } catch (error) {
            console.error('Error inserting shipping profile:', error);
            throw error;
        }
    };

    getShippingProfiles = async (): Promise<any> => {
        try {
            const response = await axios.get(
                `${apiUrl}/cost-settings/shipping-profiles`,
            );
            return response.data; // Return the shipping profiles data from the response
        } catch (error) {
            console.error('Error fetching shipping profiles:', error);
            throw error;
        }
    };

    insertPaymentGatewaySettings = async (
        settings: PaymentGatewaySettings,
    ): Promise<any> => {
        try {
            console.log('Settings:', settings);
            const response = await axios.post(
                `${apiUrl}/cost-settings/insert-payment-gateway`,
                {
                    write_key: settings.writeKey,
                    gateway_name: settings.gatewayName,
                    percentage_fee: settings.percentageFee,
                    fixed_fee: settings.fixedFee,
                    is_shopify_payments: settings.isShopifyPayments,
                },
            );
            return response.data; // Return the response data
        } catch (error) {
            console.error('Error inserting payment gateway settings:', error);
            throw error;
        }
    };

    getPaymentGateways = async (): Promise<any> => {
        try {
            const response = await axios.get(
                `${apiUrl}/cost-settings/payment-gateways`,
                {},
            );
            return response.data; // Returns { success: true, data: [...paymentGateways] }
        } catch (error) {
            console.error('Error fetching payment gateway settings:', error);
            throw error;
        }
    };

    updatePaymentGatewaySettings = async (
        record: PaymentGatewaySettings,
    ): Promise<any> => {
        try {
            const response = await axios.put(
                `${apiUrl}/cost-settings/update-payment-gateway/${record.gatewayId}`,
                {
                    percentage_fee: record.percentageFee,
                    fixed_fee: record.fixedFee,
                },
            );
            return response.data;
        } catch (error) {
            console.error('Error updating payment gateway settings:', error);
            throw error;
        }
    };

    getPeriscopeAdvertisingConnections = async (platformType: string) => {
        try {
            const response = await axios.get(
                `${apiUrl}/periscope/advertising-connections`,
                {
                    params: {
                        platform_type: platformType,
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error(
                'Error fetching periscope advertising connections:',
                error,
            );
            throw error;
        }
    };

    getPeriscopeEvents = async (accountId: string): Promise<any> => {
        try {
            const response = await axios.get(`${apiUrl}/periscope/events`, {
                params: {
                    account_id: accountId,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching periscope events:', error);
            throw error;
        }
    };

    updatePeriscopeEvents = async (
        accountId: string,
        eventIds: string[],
    ): Promise<any> => {
        try {
            const response = await axios.put(
                `${apiUrl}/periscope/events`,
                { eventIds },
                {
                    params: {
                        account_id: accountId,
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Error updating periscope events:', error);
            throw error;
        }
    };

    updateStoreCogsSettings = async (
        platformType: string,
        cogsSettings: COGSSettings,
    ): Promise<any> => {
        try {
            const response = await axios.put(
                `${apiUrl}/cost-settings/store-cogs`,
                cogsSettings,
                {
                    params: {
                        platform_type: platformType,
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Error updating store COGS settings:', error);
            throw error;
        }
    };

    updateProductCogsSettings = async (
        platformType: string,
        productCogsSettings: any[],
    ): Promise<any> => {
        try {
            const response = await axios.put(
                `${apiUrl}/cost-settings/products-cogs`,
                {
                    products: productCogsSettings,
                },
                {
                    params: {
                        platform_type: platformType,
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Error updating product COGS settings:', error);
            throw error;
        }
    };

    updateShippingProfile = async (
        shippingProfile: ShippingProfile,
    ): Promise<any> => {
        try {
            const response = await axios.put(
                `${apiUrl}/cost-settings/update-shipping-profile/${shippingProfile.profileId}`,
                {
                    profile_name: shippingProfile.profileName,
                    is_worldwide: shippingProfile.isWorldwide,
                    regions: shippingProfile.regions,
                    rate_type: shippingProfile.rateType,
                    shipping_rate: shippingProfile.shippingRate,
                    weight_tiers: shippingProfile.weightTiers,
                    fulfillment_methods: shippingProfile.fulfillmentMethods,
                },
            );
            return response.data;
        } catch (error) {
            console.error('Error updating shipping profile:', error);
            throw error;
        }
    };

    generateAndInsertOutbrainToken = async (
        encodedAuth: string,
    ): Promise<string> => {
        try {
            const response = await axios.post(
                `${apiUrl}/connectors/outbrain/auth-url`,
                {
                    auth: encodedAuth,
                },
            );
            return response.data.url; // Return the URL from the response
        } catch (error) {
            console.error('Error getting Outbrain auth URL:', error);
            throw error;
        }
    };

    getTaboolaAuthUrl = async (): Promise<string> => {
        try {
            const response = await axios.get(
                `${apiUrl}/connectors/taboola/auth-url`,
            );
            return response.data.url; // Return the URL from the response
        } catch (error) {
            console.error('Error getting Pinterest auth URL:', error);
            throw error;
        }
    };
}

export const apiService = new ApiService();
