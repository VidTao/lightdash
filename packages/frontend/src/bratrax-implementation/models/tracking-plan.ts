export type PlatformType = 'shopify' | 'gohighlevel' | 'clickfunnels';

export interface TrackingProperty {
  name: string;
  type: string;
  description: string;
  required: boolean;
  source: string;
  example?: string;
}

export interface TrackingEvent {
  name: string;
  description: string;
  platform: PlatformType;
  isCustom: boolean;
  properties: TrackingProperty[];
  version: string;
  lastUpdated: string;
  category: string;
  whenToFire: string;
}

export interface Platform {
  platform: PlatformType;
  standardEvents: TrackingEvent[];
  customEvents: TrackingEvent[];
}

export interface TrackingPlan {
  platforms: Platform[];
  commonProperties: {
    user: TrackingProperty[];
    session: TrackingProperty[];
    conversion: TrackingProperty[];
  };
}

export interface PlatformDescription {
  title: string;
  description: string;
  icon: JSX.Element;
  features: string[];
}

export type PlatformDescriptions = {
  [K in PlatformType]: PlatformDescription;
}; 