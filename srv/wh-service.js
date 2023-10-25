const cds = require("@sap/cds");
const { getRandomBoolean } = require("./utils");
const scheduler = require("node-cron");

module.exports = function (srv) {
  const { WarehouseOrderItems, WarehouseOrders, DeliveryForecasts, Orders } =
    srv.entities;

  const repeatIntervalCronPattern =
    process.env.SCHEDULER_REPEAT_PATTERN || "* * * * *"; // Every minute

  scheduler.schedule(repeatIntervalCronPattern, () => {
    srv.emit("triggerDeliveryUpdate", {});
  });

  this.on("collectItem", async (req) => {
    const itemID = req.data.id;
    const itemUser = req.data.userEmail;

    const whOItem = await SELECT.one.from(
      WarehouseOrderItems,
      itemID,
      (item) => {
        item`.*`,
          item.order((order) => {
            order.processor_email, order.status_ID;
          });
      }
    );

    const whOItemsNotCollected = await SELECT.from(WarehouseOrderItems).where({
      order_ID: whOItem.order_ID,
      status_ID: "WAITING_FOR_COLLECTION",
      ID: {
        "<>": itemID,
      },
    });

    let errorMessage = "";

    let isError = false;

    if (whOItem.order.processor_email !== itemUser) {
      errorMessage = "Unable to update. You are not the processor.";
      isError = true;
    } else if (whOItem.status_ID === "COLLECTED") {
      errorMessage = "Product is already collected.";
      isError = true;
    }

    if (!isError) {
      try {
        await UPDATE(WarehouseOrderItems, itemID).with({
          status_ID: "COLLECTED",
        });

        if (whOItem.status_ID === "PACKING") {
          await UPDATE(WarehouseOrders, whOItem.order_ID).with({
            status_ID: "PACKING_IN_PROGRESS",
          });
        }

        if (!whOItemsNotCollected.length) {
          await UPDATE(WarehouseOrders, whOItem.order_ID).with({
            status_ID: "DELIVERY_IN_PROGRESS",
          });
        }

        return true;
      } catch (error) {
        return false;
      }
    } else {
      req.error({
        message: errorMessage,
      });
    }
  });

  this.on(["updateDelivery", "triggerDeliveryUpdate"], async (req) => {
    const data = await SELECT.from(WarehouseOrders, (whOrder) => {
      whOrder`.*`,
        whOrder.parentOrder((pO) => {
          pO`.*`, pO.warehouseOrders((pOwhO) => pOwhO`.*`);
        });
    }).where({
      status_ID: "DELIVERY_IN_PROGRESS",
    });

    let parentOrdersID = [];

    for (let i = 0; i < data.length; i++) {
      const order = data[i];

      const isDelivered = getRandomBoolean(0.5);

      if (isDelivered) {
        await UPDATE(WarehouseOrders, order.ID).with({
          status_ID: "DELIVERED",
        });

        await UPDATE(DeliveryForecasts, { order_ID: order.ID }).with({
          actualDate: new Date().getTime(),
        });

        parentOrdersID.push(order.parentOrder_ID);
      }
    }

    if (parentOrdersID.length) {
      const parentOrders = await SELECT.from(Orders, (order) => {
        order`.*`,
          order.warehouseOrders((whO) => {
            whO`.*`;
          });
      }).where({
        ID: {
          in: parentOrdersID,
        },
      });

      for (let i = 0; i < parentOrders.length; i++) {
        const pOrder = parentOrders[i];
        if (!pOrder.warehouseOrders.some((o) => o.status_ID !== "DELIVERED")) {
          await UPDATE(Orders, pOrder.ID).with({
            status_ID: "CLOSED",
          });
        }
      }

      console.log();
    }
  });
};
