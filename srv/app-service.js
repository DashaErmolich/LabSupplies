const cds = require("@sap/cds");

module.exports = function (srv) {
  const { Orders, OrderItems, WarehouseProducts, Contacts } = srv.entities;

  this.before("NEW", Orders.drafts, async (req) => {
    req.data.status_ID = "OPENED";
    req.data.processor_email = req.user.id;
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
      req.data.status_ID = "WAITING_FOR_APPROVE";
    }
  });

  this.on("SAVE", Orders, async (req, next) => {
    const currentOrderItems = req.data.items;
    const prevOrderItems = await SELECT.from(OrderItems).where({
      order_ID: req.data.ID,
    });

    const diffForInserting = currentOrderItems.filter(
      ({ item_product_ID, item_warehouse_ID }) =>
        !prevOrderItems.some(
          (item) =>
            item.item_product_ID === item_product_ID &&
            item.item_warehouse_ID === item_warehouse_ID
        )
    );

    const diffForDeletion = prevOrderItems
      .filter(
        ({ item_product_ID, item_warehouse_ID }) =>
          !currentOrderItems.some(
            (item) =>
              item.item_product_ID === item_product_ID &&
              item.item_warehouse_ID === item_warehouse_ID
          )
      )
      .map((item) => ({ ...item, qty: item.qty * -1 }));

    const diffForUpdate = prevOrderItems
      .filter(({ item_product_ID, item_warehouse_ID, qty }) =>
        currentOrderItems.some(
          (item) =>
            item.item_product_ID === item_product_ID &&
            item.item_warehouse_ID === item_warehouse_ID &&
            item.qty !== qty
        )
      )
      .map((item) => {
        const current = currentOrderItems.find(
          (v) =>
            v.item_product_ID === item.item_product_ID &&
            v.item_warehouse_ID === item.item_warehouse_ID
        );
        return { ...item, qty: current.qty - item.qty };
      });

    const all = [...diffForDeletion, ...diffForInserting, ...diffForUpdate];

    const final = [];

    for (let i = 0; i < all.length; i++) {
      const item = all[i];
      const data = await SELECT(WarehouseProducts, {
        warehouse_ID: item.item_warehouse_ID,
        product_ID: item.item_product_ID,
      });

      if (data.stock >= item.qty) {
        final.push({
          listItem: item,
          whItem: data,
        });
      } else {
        final.push(null);
      }
    }

    if (final.every((item) => item !== null)) {
      for (let i = 0; i < final.length; i++) {
        const item = final[i];
        try {
          await UPDATE(WarehouseProducts, {
            warehouse_ID: item.listItem.item_warehouse_ID,
            product_ID: item.listItem.item_product_ID,
          }).with({
            stock: item.whItem.stock - item.listItem.qty,
          });
        } catch (error) {
          console.log(error);
        }
      }
    } else {
      req.error({
        message: "Some items are unavailable",
      });
    }

    return next();
  });

  this.before("SAVE", Orders, async (req) => {
    if (!req.data.processor_email) {
      const userID = req.user.id;

      const userContact = await SELECT.one
        .from(Contacts)
        .where({ email: userID });
    
      req.data.processor_email = userContact.manager_email;
    }
  });

  this.before("UPDATE", OrderItems.drafts, async (req) => {
    if (!req.data.item_product_ID && !req.data.item_product_ID) {
      const one = await SELECT.one.from(OrderItems.drafts, req.data.ID);
      const whp = await SELECT.one.from(WarehouseProducts, {
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

  this.before("UPDATE", OrderItems.drafts, async (req) => {
    if (req.data.item_product_ID && req.data.item_product_ID) {
      const whp = await SELECT.one.from(WarehouseProducts, {
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

  // this.before("UPDATE", OrderItems.drafts, async (req) => {
  //   const item = await SELECT.from(OrderItems.drafts, req.data.ID);
  //   const items = await SELECT.from(OrderItems.drafts).where({order_ID: item.order_ID});
  //   const a =  items.filter((v) => v.item_product_ID !== item.item_product_ID && v.item_warehouse_ID !== item.item_warehouse_ID).length < items.length - 1;

  //   if (a) {
  //     req.error({
  //       message: "this Item already exists in list",
  //       target: 'item_product_ID',
  //     })
  //   }
  // });

  this.on("approveOrder", async (req) => {
    const orderID = req._params[0].ID;

    try {
      await UPDATE(Orders, {
        ID: orderID,
      }).with({
        status_ID: "APPROVED",
      });
    } catch (error) {
      console.log(error);
    }
  });

  this.on("rejectOrder", async (req) => {
    const orderID = req._params[0].ID;

    try {
      await UPDATE(Orders, {
        ID: orderID,
      }).with({
        status_ID: "REJECTED",
        notes: req.data.note,
      });
    } catch (error) {
      console.log(error);
    }
  });

  this.after("READ", Orders, (data, req) => {
    if (data.length) {
      console.log(1);
    
      let isReviewerRole = false;
      let isApproveButtonHidden = true;
      let isRejectButtonHidden = true;

      if (req.user.is('Reviewer')) {
        isReviewerRole = true;
      }

      if (isReviewerRole) {
        if (data[0]?.status?.ID !== "REJECTED" || data[0]?.status?.ID !== "APPROVED") {
          data[0].isRejectHidden = false;
          data[0].isApproveHidden = false;
        } else {
          data[0].isRejectHidden = true;
          data[0].isApproveHidden = true;
        }
      } else {
        data[0].isRejectHidden = true;
        data[0].isApproveHidden = true;
      }
    }
  });
};
