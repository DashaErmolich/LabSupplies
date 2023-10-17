const cds = require("@sap/cds");

module.exports = function (srv) {
  const { Orders, OrdersItems, WarehousesProducts, OrderStatuses } = srv.entities;

  this.before("NEW", Orders.drafts, async (req) => {
    req.data.status_ID = 'OPENED';
  });

  this.before("CREATE", Orders, async (req) => {
    const data = new Date();

    req.data.title = `Order ${data.getDate()}/${data.getMinutes()}`;
  });

  this.before("SAVE", Orders, async (req) => {

    if (!req.data.items.length) {
      req.error({
        message: "Add at least one item to order",
      });
    } else {
      req.data.status_ID = 'WAITING_FOR_APPROVE';
    }
  });

  this.before("UPDATE", OrdersItems.drafts, async (req) => {
    if (!req.data.item_product_ID && !req.data.item_product_ID) {
      const one = await SELECT.one.from(OrdersItems.drafts, req.data.ID);
      const whp = await SELECT.one.from(WarehousesProducts, {
        product_ID: one.item_product_ID,
        warehouse_ID: one.item_warehouse_ID,
      });

      if (req.data.qty > whp.stock) {
        req.error({
          message: "There are no such items in stock",
          target: "qty",
        });
      } else if (req.data.qty <= 0) {
        req.error({
          message: "Enter the valid value",
          target: "qty",
        });
      }
    }
  });

  this.before("UPDATE", OrdersItems.drafts, async (req) => {
    if (req.data.item_product_ID && req.data.item_product_ID) {
      const whp = await SELECT.one.from(WarehousesProducts, {
        product_ID: req.data.item_product_ID,
        warehouse_ID: req.data.item_warehouse_ID,
      });

      if (!whp.stock) {
        req.warn({
          message: "This item is not available now",
        });
      } else {
        req.data.qty = null;
      }
    }
  });
};
