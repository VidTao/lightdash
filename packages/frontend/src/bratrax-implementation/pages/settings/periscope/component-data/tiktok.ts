import { commonDeliveryData, commonEvents } from './shared-events';

export const tiktokEvents = commonEvents;
export const tiktokDeliveryData = commonDeliveryData;

export const tiktokConnectionOptions = [
    {
        placeholder: 'Select TikTok Account',
        options: [
            { value: 'account1', label: 'Account 1' },
            { value: 'account2', label: 'Account 2' },
        ],
    },
    {
        placeholder: 'Select Pixel ID',
        options: [
            { value: 'pixel1', label: 'Pixel 1111' },
            { value: 'pixel2', label: 'Pixel 2' },
        ],
    },
];
