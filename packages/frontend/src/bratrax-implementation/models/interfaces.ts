export interface AdPlatformAccountInfo {
  accountId: string;
  accountName: string;
}

export interface PlatformConnection {
  // Authentication
  access_token: string;
  refresh_token: string;
  token_type: string;
  token_expiry: string;
  refresh_token_expires_in: string | null;

  // Amazon Ads specific
  amazon_ads_client_id: string;
  amazon_ads_client_secret: string;
  amazon_ads_endpoint: string;
  amazon_ads_profile_id: string;
  amazon_ads_redirect_uri: string;
  amazon_ads_region: string;
  accounts_data: any | null;

  // AWS related
  aws_access_key: string | null;
  aws_secret_key: string | null;
  role_arn: string | null;

  // Client/User information
  client_id: string;
  user_id: string | null;
  email: string | null;
  write_key: string;
  uc_id: number;

  // Platform specific
  source: string;
  marketplaces: any | null;
  sales_data_granularity: string | null;
  start_date: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;

  // Integration specific fields
  shopify_store: string | null;
  cf2_workspace_id: string | null;
  cf2_workspace_url: string | null;
  ghl_account_id: string | null;
  ghl_client_id: string | null;
  ghl_client_secret: string | null;
  klaviyo_client_id: string | null;
  klaviyo_client_secret: string | null;
  long_lived_fb_token: string | null;
  sp_api_client_id: string | null;
  sp_api_client_secret: string | null;
  stripe_account_id: string | null;
  stripe_secret_key: string | null;
  slack_channel_id: string | null;
  slack_workspace_id: string | null;
  slack_workspace_name: string | null;
}

export interface CrmConnection {
  storeUrl: string;
  storeName: string;
  currency: string;
  timezone: string;
  createdAt: string;
}

export interface AdvertisingConnection {
  accountName: string;
  accountId: string;
  currency: string;
  timezone: string;
  createdAt: string;
}

export interface InviteUserData {
  email: string;
  name?: string;
  role: "admin" | "user";
}

export interface ProductData {
  productId: string;
  key: string;
  title: string;
  sku: string;
  price: number;
  productCost: number;
  handlingFee: number;
  quantity: number;
  cogsAmount: number;
}

export interface AmazonProduct {
  key: string;
  productName: string;
  sku: string;
  costCOGS: number;
  handlingFee: number;
}

export interface ShippingProfile {
  profileId: number;
  writeKey: string;
  profileName: string;
  isWorldwide: boolean;
  regions: Region[];
  rateType: "fixed" | "tiered";
  shippingRate: number;
  weightTiers: [];
  fulfillmentMethods: [];
}

export interface Region {
  label: string;
  value: string;
  countries: string[];
}

export interface PaymentGatewaySettings {
  gatewayId: number;
  writeKey: string;
  gatewayName: string;
  fixedFee: number | string;
  percentageFee: number;
  isShopifyPayments?: boolean;
}
export interface VariableExpense {
  key: string;
  name: string;
  category: string;
  metric: string;
  percent: number;
  startDate: string;
  endDate: string | null;
  adSpend: boolean;
}

export interface COGSSettings {
  enableCOGS: boolean;
  enableHandlingFee: boolean;
  handlingFee: number;
  bidirectionalCOGS: boolean;
}

export interface PeriscopeEvent {
  eventId: string;
  name: string;
  description: string;
  isChecked: boolean;
}
