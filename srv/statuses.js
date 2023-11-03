const OrderStatuses = {
  Opened: "OPENED",
  EditWaiting: "WAITING_FOR_EDIT",
  ApproveWaiting: "WAITING_FOR_APPROVE",
  DeliveryWaiting: "WAITING_FOR_DELIVERY",
  Rejected: "REJECTED",
  Closed: "CLOSED",
};

const WhOrderStatuses = {
  PackingWaiting: "WAITING_FOR_PACKING",
  PackingInProgress: "PACKING_IN_PROGRESS",
  DeliveryInProgress: "DELIVERY_IN_PROGRESS",
  Delivered: "DELIVERED",
};

const WhOrderItemStatuses = {
  CollectingWaiting: "WAITING_FOR_COLLECTION",
  Collected: "COLLECTED",
};

const ORDER_STATUSES = [
  {
    id: OrderStatuses.Opened,
    step: 0,
  },
  {
    id: OrderStatuses.EditWaiting,
    step: 1,
  },
  {
    id: OrderStatuses.ApproveWaiting,
    step: 2,
  },
  {
    id: OrderStatuses.DeliveryWaiting,
    step: 3,
  },
  {
    id: OrderStatuses.Rejected,
    step: 4,
  },
  {
    id: OrderStatuses.Closed,
    step: 4,
  },
];

const WH_ORDER_STATUSES = [
  {
    id: WhOrderStatuses.PackingWaiting,
    step: 1,
  },
  {
    id: WhOrderStatuses.PackingInProgress,
    step: 2,
  },
  {
    id: WhOrderStatuses.DeliveryInProgress,
    step: 3,
  },
  {
    id: WhOrderStatuses.Delivered,
    step: 4,
  },
];

module.exports = {
  OrderStatuses,
  WhOrderStatuses,
  WhOrderItemStatuses,
  ORDER_STATUSES,
  WH_ORDER_STATUSES,
};
