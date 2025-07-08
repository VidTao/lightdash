import { useLocation } from 'react-router';

const useQueryParams = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code') ?? '';
    const shop = queryParams.get('shop') ?? '';
    const state = queryParams.get('state') ?? '';
    const hmac = queryParams.get('hmac') ?? '';
    const spApiAuthCode = queryParams.get('spapi_oauth_code') ?? '';
    const sellingPartnerId = queryParams.get('selling_partner_id') ?? '';
    return { code, shop, state, hmac, spApiAuthCode, sellingPartnerId };
};

export default useQueryParams;
