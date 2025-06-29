import { commonEvents, commonDeliveryData } from './shared-events';

export const metaEvents = commonEvents;
export const metaDeliveryData = commonDeliveryData;

export const metaConnectionOptions = [
  {
    placeholder: 'Select Meta Dataset',
    options: [
      { value: 'dataset1', label: 'Dataset 1' },
      { value: 'dataset2', label: 'Dataset 2' }
    ]
  }
]; 