const { ERROR_MESSAGES, showError } = require("./erorrs");
const { sendNotifications } = require("./notifications");
const { getRandomBoolean } = require("./utils");
const scheduler = require("node-cron");

module.exports = function (srv) {
  const {
    WarehouseOrderItems,
    WarehouseOrders,
    DeliveryForecasts,
    Orders,
    WarehouseContacts,
  } = srv.entities;

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
      errorMessage = ERROR_MESSAGES.actions.forbidden;
      isError = true;
    } else if (whOItem.status_ID === "COLLECTED") {
      errorMessage = ERROR_MESSAGES.actions.collectItem;
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
          try {
            await UPDATE(WarehouseOrders, whOItem.order_ID).with({
              status_ID: "DELIVERY_IN_PROGRESS",
            });

            const whContact = await SELECT.from(WarehouseContacts, itemUser);
            const whOrder = await SELECT.from(
              WarehouseOrders,
              whOItem.order_ID,
              (whO) => {
                whO`.*`,
                  whO.parentOrder((pO) => {
                    pO.title, pO.processor((pOp) => pOp`.*`);
                  });
              }
            );

            try {
              await sendNotifications(
                "DELIVERY_IN_PROGRESS",
                whOrder.title,
                whContact,
                whOrder.parentOrder.processor,
                ""
              );
            } catch (error) {
              console.log(error);
            }
          } catch (error) {
            console.log(error);
          }
        }

        return true;
      } catch (error) {
        return false;
      }
    } else {
      showError(req, errorMessage);
    }
  });

  this.on(["updateDelivery", "triggerDeliveryUpdate"], async (req) => {
    const data = await SELECT.from(WarehouseOrders, (whOrder) => {
      whOrder`.*`, whOrder.processor((whOP) => whOP`.*`);
      whOrder.parentOrder((pO) => {
        pO`.*`, pO.warehouseOrders((pOwhO) => pOwhO`.*`);
      });
    }).where({
      status_ID: "DELIVERY_IN_PROGRESS",
    });

    let parentOrdersID = [];
    let whOProcessors = [];

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
        whOProcessors.push(order.processor_email);
      }
    }

    if (parentOrdersID.length) {
      const parentOrders = await SELECT.from(Orders, (order) => {
        order`.*`,
          order.warehouseOrders((whO) => {
            whO`.*`, whO.processor((pr) => pr`.*`);
          }),
          order.contact((c) => {
            c`.*`;
          });
      }).where({
        ID: {
          in: parentOrdersID,
        },
      });

      for (let i = 0; i < parentOrders.length; i++) {
        const pOrder = parentOrders[i];
        const whProcessor = data.find(
          (item) => item.processor_email === whOProcessors[i]
        )?.processor;
        if (!pOrder.warehouseOrders.some((o) => o.status_ID !== "DELIVERED")) {
          try {
            await UPDATE(Orders, pOrder.ID).with({
              status_ID: "CLOSED",
            });

            try {
              await sendNotifications(
                "CLOSED",
                pOrder.title,
                whProcessor,
                pOrder.contact,
                pOrder.reviewNotes
              );
            } catch (error) {
              console.log(error);
            }
          } catch (error) {
            console.log(error);
          }
        }
      }
    }
  });
};
