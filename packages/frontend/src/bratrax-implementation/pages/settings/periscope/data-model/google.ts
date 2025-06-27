import { commonEvents, commonDeliveryData } from './shared-events';

export const googleEvents = commonEvents;
export const googleDeliveryData = commonDeliveryData;

export const googleConnectionOptions = [
  {
    placeholder: 'Select Google Ads Account',
    options: [
      { value: 'account1', label: 'Account 1' },
      { value: 'account2', label: 'Account 2' }
    ]
  },
  {
    placeholder: 'Select Conversion Tag',
    options: [
      { value: 'tag1', label: 'Tag 1' },
      { value: 'tag2', label: 'Tag 2' }
    ]
  }
]; 