import { DeliveryEvent, PlatformEvent } from '../types';

export const commonEvents: PlatformEvent[] = [
  {
    name: 'alert_displayed',
    description: 'The alert_displayed event records instances when a user encounters an alert message'
  },
  {
    name: 'cart_viewed',
    description: 'The cart_viewed event logs an instance where a customer visited the cart page.'
  },
  {
    name: 'checkout_address_info_submitted',
    description: 'The checkout_address_info_submitted event logs an instance of a customer submitting their mailing address.'
  },
  {
    name: 'checkout_completed',
    description: 'The checkout_completed event logs when a visitor completes a purchase.'
  },
  {
    name: 'checkout_contact_info_submitted',
    description: 'The checkout_contact_info_submitted event logs an instance where a customer submits a checkout form.'
  },
  {
    name: 'checkout_shipping_info_submitted',
    description: 'The checkout_shipping_info_submitted event logs an instance where the customer chooses a shipping rate.'
  },
  {
    name: 'checkout_started',
    description: 'The checkout_started event logs an instance of a customer starting the checkout process.'
  },
  {
    name: 'collection_viewed',
    description: 'The collection_viewed event logs an instance where a customer visited a product collection index page.'
  },
  {
    name: 'Custom_event',
    description: 'Desc'
  },
  {
    name: 'page_viewed',
    description: 'The page_viewed event logs an instance where a customer visited a page. This event is available on the online store, checkout, and Order status pages.'
  },
  {
    name: 'payment_info_submitted',
    description: 'The payment_info_submitted event logs an instance of a customer submitting their payment information.'
  },
  {
    name: 'product_added_to_cart',
    description: 'The product_added_to_cart event logs an instance where a customer adds a product to their cart.'
  },
  {
    name: 'product_removed_from_cart',
    description: 'The product_removed_from_cart event logs an instance where a customer removes a product from their cart.'
  },
  {
    name: 'product_viewed',
    description: 'The product_viewed event logs an instance where a customer visited a product details page.'
  },
  {
    name: 'search_submitted',
    description: 'The search_submitted event logs an instance where a customer performed a search on the storefront.'
  },
  {
    name: 'ui_extension_errored',
    description: 'The ui_extension_errored event logs occurrences when an extension fails to render due to an uncaught exception in the extension code.'
  }
];

export const commonDeliveryData: DeliveryEvent[] = [
  {
    key: '1',
    event: 'Page View',
    totalEventsSent: 0,
    eventsWithMatchedIds: 0,
    errors: 0,
    latestEventTimestamp: 0
  },
  {
    key: '2',
    event: 'View Content',
    totalEventsSent: 0,
    eventsWithMatchedIds: 0,
    errors: 0,
    latestEventTimestamp: 0
  },
  {
    key: '3',
    event: 'Search',
    totalEventsSent: 0,
    eventsWithMatchedIds: 0,
    errors: 0,
    latestEventTimestamp: 0
  },
  {
    key: '4',
    event: 'Signup',
    totalEventsSent: 0,
    eventsWithMatchedIds: 0,
    errors: 0,
    latestEventTimestamp: 0
  },
  {
    key: '5',
    event: 'Add to Cart',
    totalEventsSent: 0,
    eventsWithMatchedIds: 0,
    errors: 0,
    latestEventTimestamp: 0
  },
  {
    key: '6',
    event: 'Custom',
    totalEventsSent: 0,
    eventsWithMatchedIds: 0,
    errors: 0,
    latestEventTimestamp: 0
  }
]; 