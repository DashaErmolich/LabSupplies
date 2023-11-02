const ERROR_MESSAGES = {
  default: "Something bad happened. Try again later.",
  orders: {
    emptyProductsList: "Add at least one product to order.",
  },
  warehouseProducts: {
    stockUpdate:
      "Something bad happened. Unable update warehouse products qty.",
    stockValidate: "Some products qty is not valid.",
  },
  orderItems: {
    qtyStockValidation: "There are no such items in stock.",
    qtyInvalid: 'Enter the valid value',
    productsUnique: 'The product already exists in list.'
  },
  actions: {
    approveOrder: 'Something bad happened. Order approve failed.',
    rejectOrder: 'Something bad happened. Order reject failed.',
    collectItem: 'Product is already collected.',
    forbidden: 'This action is forbidden because you are not a processor of this order.',
  },
  pdfReport: {
    label: 'Something bad happened. Product label loading failed.',
    whOrder: 'Something bad happened. Order report loading failed.',
  }
};

const STATUS_CODES = {
  default: 410,
};

function showError(req, message, target, code) {
  return req.error({
    code: code || STATUS_CODES.default,
    message: message || ERROR_MESSAGES.default,
    target: target,
  });
}

module.exports = { ERROR_MESSAGES, showError };
