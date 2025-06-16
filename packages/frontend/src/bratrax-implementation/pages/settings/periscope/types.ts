export interface DeliveryEvent {
  key: string;
  event: string;
  totalEventsSent: number;
  eventsWithMatchedIds: number;
  errors: number;
  latestEventTimestamp: number;
}

export interface PlatformEvent {
  name: string;
  description: string;
}

export interface PlatformSettingsProps {
  onBack: () => void;
  defaultTab?: 'overview' | 'settings';
} 