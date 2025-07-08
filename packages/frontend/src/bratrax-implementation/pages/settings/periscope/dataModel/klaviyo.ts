import { commonEvents, commonDeliveryData } from './shared-events';

export const klaviyoEvents = commonEvents;
export const klaviyoDeliveryData = commonDeliveryData;

export const klaviyoConnectionOptions = [
  {
    placeholder: 'Select Klaviyo Account',
    options: [
      { value: 'account1', label: 'Account 1' },
      { value: 'account2', label: 'Account 2' }
    ]
  }
]; 