export const ORDER_STATUS = {
  RECEIVED: 'RECEIVED',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVED: 'SERVED',
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.RECEIVED]: 'Order Received',
  [ORDER_STATUS.CONFIRMED]: 'Order Confirmed',
  [ORDER_STATUS.PREPARING]: 'Preparing in Kitchen',
  [ORDER_STATUS.READY]: 'Ready to Serve',
  [ORDER_STATUS.SERVED]: 'Order Served',
};

export const ORDER_STATUS_STEPS = [
  { key: ORDER_STATUS.RECEIVED, label: 'Order Received', desc: 'Sent to restaurant' },
  { key: ORDER_STATUS.CONFIRMED, label: 'Order Confirmed', desc: 'Accepted by kitchen' },
  { key: ORDER_STATUS.PREPARING, label: 'Preparing', desc: 'Chefs are cooking your meal' },
  { key: ORDER_STATUS.READY, label: 'Ready', desc: 'Plated & awaiting table runner' },
  { key: ORDER_STATUS.SERVED, label: 'Served', desc: 'Delivered to your table' },
];
