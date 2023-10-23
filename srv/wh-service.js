const cds = require("@sap/cds");

module.exports = function (srv) {
  const { WarehouseOrderItems, WarehouseOrders } = srv.entities;

  this.on("collectItem", async (req) => {
    const itemID = req.data.id;
    const itemUser = req.data.userEmail;

    const whOItem = await SELECT.one.from(WarehouseOrderItems, itemID, (item) => {
      item`.*`,
        item.order((order) => {
          order.processor_email, order.status_ID
        })
    });

    const whOItemsNotCollected = 
    await SELECT.from(WarehouseOrderItems).where({
      order_ID: whOItem.order_ID,
      status_ID: 'WAITING_FOR_COLLECTION',
      ID: {
        '<>': itemID,
      }
    });

    let errorMessage = '';

    let isError = false;


    if (whOItem.order.processor_email !== itemUser) {
      errorMessage = 'Unable to update. You are not the processor.';
      isError = true;
    } else if (whOItem.status_ID === 'COLLECTED') {
      errorMessage = 'Product is already collected.';
      isError = true;
    }

    if (!isError) {
      try {
        await UPDATE(WarehouseOrderItems, itemID).with({
          status_ID: "COLLECTED",
        });
        
        if (whOItem.status_ID === 'PACKING') {
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
      })
    }

    
  });
};
