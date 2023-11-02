const cds = require("@sap/cds");
const {
  removeDuplicates,
  setOrderStatus,
  setOrderProcessor,
  setOrderTitle,
  getOrderTitle,
  getContact,
  getRandomInt,
  getDeliveryStatistics,
} = require("./utils");

const QRCode = require("qrcode");

const { ERROR_MESSAGES, showError } = require("./erorrs");
const { PDF_TEMPLATE_PATHS, getPdfReportStream } = require("./pdf-report");
const { sendNotifications } = require("./notifications");

module.exports = function (srv) {
  const {
    Orders,
    OrderItems,
    WarehouseProducts,
    Contacts,
    Warehouses,
    WarehouseOrders,
    WarehouseOrderItems,
    DeliveryForecasts,
  } = srv.entities;

  this.before("NEW", Orders.drafts, async (req) => {
    try {
      setOrderStatus(req.data, "OPENED");
      setOrderProcessor(req.data, req.user.id);
    } catch (error) {
      showError(req, error.message);
    }
  });

  this.before("CREATE", Orders, async (req) => {
    const newOrderTitle = await getOrderTitle(Orders, "SO");
    setOrderTitle(req.data, newOrderTitle);
  });

  this.before("SAVE", Orders, async (req) => {
    if (!req.data.items.length) {
      showError(req, ERROR_MESSAGES.orders.emptyProductsList);
    } else {
      setOrderStatus(req.data, "WAITING_FOR_APPROVE");
      const userContact = await getContact(Contacts, req.user.id);
      setOrderProcessor(req.data, userContact.manager_email);
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
          showError(req, ERROR_MESSAGES.warehouseProducts.stockUpdate);
        }
      }
    } else {
      showError(req, ERROR_MESSAGES.warehouseProducts.stockValidate);
    }

    return next();
  });

  this.after("SAVE", Orders, async (order, req) => {
    const user = await SELECT.from(Contacts, req.user.id, (contact) => {
      contact`.*`,
        contact.manager((manager) => {
          manager`.*`;
        });
    });

    try {
      await sendNotifications(order.status_ID, order.title, user, user.manager);
    } catch (error) {
      req.warn({
        message: error.message,
      });
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
        showError(req, ERROR_MESSAGES.orderItems.qtyStockValidation, "qty");
      } else if (req.data.qty <= 0) {
        showError(req, ERROR_MESSAGES.orderItems.qtyInvalid, "qty");
      }
    }
  });

  this.before("UPDATE", OrderItems.drafts, async (req) => {
    if (req.data.item_product_ID && req.data.item_product_ID) {
      const whp = await SELECT.one.from(WarehouseProducts, {
        product_ID: req.data.item_product_ID,
        warehouse_ID: req.data.item_warehouse_ID,
      });

      if (whp?.stock && whp.stock === 0) {
        req.warn({
          message: "This item is not available now",
        });
      } else {
        req.data.qty = null;
      }
    }
  });

  this.before("UPDATE", OrderItems.drafts, async (req) => {
    if (req.data.item_product_ID && req.data.item_warehouse_ID) {
      const parentOrderID = await SELECT.from(
        OrderItems.drafts,
        req.data.ID
      ).columns("order_ID");
      if (parentOrderID?.order_ID) {
        const items = await SELECT.from(OrderItems.drafts).where({
          order_ID: parentOrderID?.order_ID,
          ID: { "<>": req.data.ID },
        });

        if (
          items.some(
            ({ item_warehouse_ID, item_product_ID }) =>
              item_warehouse_ID === req.data.item_warehouse_ID &&
              item_product_ID === req.data.item_product_ID
          )
        ) {
          showError(
            req,
            ERROR_MESSAGES.orderItems.productsUnique,
            "item_warehouse_ID"
          );
        }
      }
    } else if (
      (req.data.item_product_ID && !req.data.item_warehouse_ID) ||
      (req.data.item_warehouse_ID && !req.data.item_product_ID)
    ) {
      const item = await SELECT.from(OrderItems.drafts, req.data.ID);
      if (item.ID) {
        const items = await SELECT.from(OrderItems.drafts).where({
          order_ID: item.order_ID,
        });
        const whId = req.data.item_warehouse_ID || item.item_warehouse_ID;
        const prId = req.data.item_product_ID || item.item_product_ID;
        if (
          items.some(
            ({ item_warehouse_ID, item_product_ID }) =>
              item_warehouse_ID === whId && item_product_ID === prId
          )
        ) {
          showError(
            req,
            ERROR_MESSAGES.orderItems.productsUnique,
            "item_warehouse_ID"
          );
        }
      }
    }
  });

  this.on("approveOrder", async (req) => {
    const orderID = req.params[0].ID;

    const order = await SELECT.one.from(Orders, orderID, (order) => {
      order`.*`,
        order.contact((c) => {
          c`.*`, c.manager((m) => m`.*`);
        });
    });

    try {
      await UPDATE(Orders, {
        ID: orderID,
      }).with({
        status_ID: "WAITING_FOR_DELIVERY",
        processor_email: order.contact.email,
      });

      try {
        await sendNotifications(
          "WAITING_FOR_DELIVERY",
          order.title,
          order.contact.manager,
          order.contact,
          order.reviewNotes
        );
      } catch (error) {
        req.warn({
          message: error.message,
        });
      }
    } catch (error) {
      showError(req, ERROR_MESSAGES.actions.approveOrder);
    }
  });

  this.on("rejectOrder", async (req) => {
    const orderID = req.params[0].ID;

    const order = await SELECT.one.from(Orders, orderID, (order) => {
      order`.*`,
        order.processor((pr) => pr`.*`),
        order.contact((c) => c`.*`),
        order.items((items) => {
          items`.*`, items.item((itm) => itm`.*`);
        });
    });

    try {
      await UPDATE(Orders, {
        ID: orderID,
      }).with({
        status_ID: req.data.statusID,
        reviewNotes: req.data.notes,
      });
    } catch (error) {
      showError(req, ERROR_MESSAGES.actions.rejectOrder);
    }

    if (req.data.statusID === "REJECTED") {
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        try {
          await UPDATE(WarehouseProducts, {
            warehouse_ID: item.item_warehouse_ID,
            product_ID: item.item_product_ID,
          }).with({
            stock: item.item.stock + item.qty,
          });
        } catch (error) {
          showError(req, ERROR_MESSAGES.warehouseProducts.stockUpdate);
        }
      }
    }
  });

  this.after("rejectOrder", async (data, req) => {
    const orderID = req.params[0].ID;
    const order = await SELECT.one.from(Orders, orderID, (order) => {
      order`.*`,
        order.processor((pr) => pr`.*`),
        order.contact((c) => c`.*`),
        order.items((items) => items`.*`);
    });

    if (order.status_ID === "WAITING_FOR_EDIT") {
      await UPDATE(Orders, orderID).with({
        processor_email: order.contact.email,
      });
    }

    try {
      await sendNotifications(
        order.status_ID,
        order.title,
        order.processor,
        order.contact,
        order.reviewNotes
      );
    } catch (error) {
      req.warn({
        message: error.message,
      });
    }
  });

  this.after("READ", Orders, async (data, req) => {
    if (req.data.ID) {
      const order = data.find((order) => order.ID === req.data.ID);

      if (
        order.isNotApprovable !== undefined ||
        order.isNotRejectable !== undefined ||
        order.isNotEditable !== undefined ||
        order.isNotActionable !== undefined
      ) {
        let isReviewerRole = req.user.is("Reviewer");
        let orderStatusID = order.status_ID;

        if (!orderStatusID) {
          const orderStatus = await SELECT.one
            .from(Orders, req.data.ID)
            .columns("status_ID");
          orderStatusID = orderStatus.status_ID;
        }

        if (isReviewerRole) {
          order.isNotActionable = false;
          switch (orderStatusID) {
            case "WAITING_FOR_APPROVE":
              order.isNotApprovable = false;
              order.isNotRejectable = false;
              break;
          }
        } else {
          order.isNotApprovable = true;
          order.isNotRejectable = true;

          if (
            orderStatusID === "WAITING_FOR_EDIT" ||
            orderStatusID === "OPEN"
          ) {
            order.isNotEditable = false;
          }
        }
      }

      const whOrder = await SELECT.one.from(WarehouseOrders, {
        parentOrder_ID: req.data.ID,
      });

      if (whOrder?.ID) {
        order.isRelatedOrdersVisible = true;
      }
    }
  });

  this.after("approveOrder", async (req, data) => {
    const orderID = data.params[0].ID;

    const order = await SELECT.one.from(Orders, orderID, (order) => {
      order.title,
        order.items((item) => {
          item.item_product_ID, item.item_warehouse_ID, item.qty;
        });
    });

    const whIDs = removeDuplicates(
      order.items.map((item) => item.item_warehouse_ID)
    );
    const warehouses = await SELECT.from(Warehouses, (wh) => {
      wh`.*`,
        wh.contacts((contact) => {
          contact`.*`,
            contact.orders((order) => {
              order`.*`;
            });
        }),
        wh.address((address) => {
          address`.*`;
        });
    });

    for (let i = 0; i < whIDs.length; i++) {
      const wh = warehouses.find((wh) => wh.ID === whIDs[i]);

      const whOrderItems = order.items
        .filter((item) => item.item_warehouse_ID === whIDs[i])
        .map((item) => ({ ...item, status_ID: "WAITING_FOR_COLLECTION" }));
      const whOrderTitle = `${order.title}/${await getOrderTitle(
        WarehouseOrders,
        `WHO-${wh.address.region_code}`
      )}`;
      const contacts = warehouses.find((wh) => wh.ID === whIDs[i]).contacts;

      const whOrderGUID = cds.utils.uuid();

      const whOrder = {
        ID: whOrderGUID,
        title: whOrderTitle,
        items: whOrderItems,
        parentOrder_ID: orderID,
        status_ID: "PACKING",
        processor_email: contacts.sort(
          (a, b) => a.orders.length - b.orders.length
        )[0].email,
        warehouse_ID: wh.ID,
      };

      const deliveryForecast = {
        order_ID: whOrderGUID,
        predictedDate: getRandomInt(7, 25) * 60000 + Date.now(),
      };

      await INSERT.into(WarehouseOrders, whOrder);
      await INSERT.into(DeliveryForecasts, deliveryForecast);
    }
  });

  this.on("READ", WarehouseOrderItems, async (req, next) => {
    if (!req.data.ID || !req.req.originalUrl.includes("content")) {
      return next();
    }

    const labelData = await SELECT.one.from(
      WarehouseOrderItems,
      req.data.ID,
      (whItem) => {
        whItem.qty,
          whItem.item((item) => {
            item.warehouse((wh) => {
              wh.name,
                wh.address((whAddress) => {
                  whAddress`.*`;
                });
            }),
              item.product((product) => {
                product`.*`,
                  product.category((cat) => {
                    cat.name;
                  });
              });
          }),
          whItem.order((order) => {
            order.title,
              order.createdAt,
              order.parentOrder((pOrder) => {
                pOrder.processor_email,
                  pOrder.title,
                  pOrder.createdAt,
                  pOrder.deliveryTo((dTo) => {
                    dTo.name,
                      dTo.address((address) => {
                        address`.*`;
                      });
                  });
              });
          });
      }
    );

    labelData.logo = await QRCode.toDataURL(`${req.data.ID}`, {
      errorCorrectionLevel: "H",
    });

    return getPdfReportStream(labelData, PDF_TEMPLATE_PATHS.productLabel);
  });

  this.on("READ", WarehouseOrders, async (req, next) => {
    if (!req.data.ID || !req.req.originalUrl.includes("content")) {
      return next();
    }

    const reportData = await SELECT.one.from(
      WarehouseOrders,
      req.data.ID,
      (whOrder) => {
        whOrder`.*`,
          whOrder.items((whItem) => {
            whItem.qty,
              whItem.item((item) => {
                whItem.ID,
                  item.warehouse((wh) => {
                    wh.name,
                      wh.address((whAddress) => {
                        whAddress`.*`;
                      });
                  }),
                  item.product((product) => {
                    product`.*`,
                      product.category((cat) => {
                        cat.name;
                      }),
                      product.supplier((s) => {
                        s.name;
                      });
                  });
              }),
              whItem.order((order) => {
                order.title,
                  order.createdAt,
                  order.parentOrder((pOrder) => {
                    pOrder.processor_email,
                      pOrder.title,
                      pOrder.createdAt,
                      pOrder.deliveryTo((dTo) => {
                        dTo.name,
                          dTo.address((address) => {
                            address`.*`;
                          });
                      });
                  });
              });
          }),
          whOrder.parentOrder((pOrder) => {
            pOrder.processor_email,
              pOrder.title,
              pOrder.createdAt,
              pOrder.deliveryTo((dTo) => {
                dTo.name,
                  dTo.address((address) => {
                    address`.*`;
                  });
              });
          }),
          whOrder.warehouse((wh) => {
            wh`.*`,
              wh.address((whA) => {
                whA`.*`;
              });
          });
      }
    );

    for (let i = 0; i < reportData.items.length; i++) {
      reportData.items[i].logo = await QRCode.toDataURL(
        `${reportData.items[i].ID}`,
        {
          errorCorrectionLevel: "H",
        }
      );
    }

    return getPdfReportStream(reportData, PDF_TEMPLATE_PATHS.whOrderReport);
  });

  this.before(["approveOrder", "rejectOrder"], async (req) => {
    if (req.params[0].ID) {
      const order = await SELECT.one.from(Orders, req.params[0].ID);

      if (order.processor_email !== req.user.id) {
        showError(req, ERROR_MESSAGES.actions.forbidden)
      }
    }
  });

  this.after("READ", Orders, async (data, req) => {
    if (
      data[0]?.warehouseOrders?.length &&
      data[0]?.warehouseOrders[0]?.deliveryForecast?.ID !== undefined
    ) {
      const whOrders = await SELECT.from(WarehouseOrders, (whOrder) => {
        whOrder`.*`, whOrder.deliveryForecast((v) => v`.*`);
      }).where({ parentOrder_ID: data[0].ID });

      const dataWhOrders = data[0].warehouseOrders;

      for (let i = 0; i < dataWhOrders.length; i++) {
        const whOrder = dataWhOrders[i];

        const order = whOrders.find((whO) => whO.ID === whOrder.ID);

        const deliveryStatistics = getDeliveryStatistics(
          order.createdAt,
          order.deliveryForecast.predictedDate,
          order.deliveryForecast.actualDate
        );

        whOrder.deliveryForecast.daysCounter = deliveryStatistics.daysCounter;
        whOrder.deliveryForecast.residualPercentage =
          deliveryStatistics.residualPercentage;
        whOrder.deliveryForecast.isCritical = deliveryStatistics.isCritical;
        whOrder.deliveryForecast.criticalityName =
          deliveryStatistics.criticalityName;
        whOrder.deliveryForecast.trend = deliveryStatistics.trend;
      }
    }
  });

  this.after("READ", Orders, async (data, req) => {
    if (data[0]?.progress !== undefined && data[0]?.status?.ID !== undefined) {
      const STEPS_COUNT = 4;

      data.forEach((item) => {
        let currentStep;

        switch (item.status.ID) {
          case "WAITING_FOR_EDIT":
            currentStep = 1;
            break;
          case "WAITING_FOR_APPROVE":
            currentStep = 2;
            break;
          case "WAITING_FOR_DELIVERY":
            currentStep = 3;
            break;
          default:
            currentStep = 4;
        }

        item.progress = (currentStep / STEPS_COUNT) * 100;
      });
    }
  });

  this.after("READ", WarehouseOrders, async (data, req) => {
    if (data[0]?.progress !== undefined && data[0]?.status?.ID !== undefined) {
      const STEPS_COUNT = 4;

      data.forEach((item) => {
        let currentStep;

        switch (item.status.ID) {
          case "PACKING":
            currentStep = 1;
            break;
          case "PACKING_IN_PROGRESS":
            currentStep = 2;
            break;
          case "DELIVERY_IN_PROGRESS":
            currentStep = 3;
            break;
          default:
            currentStep = 4;
        }

        item.progress = (currentStep / STEPS_COUNT) * 100;
      });
    }

    if (data[0]?.ID && data[0]?.deliveryForecast?.ID) {
      const whOrder = await SELECT.one.from(
        WarehouseOrders,
        data[0].ID,
        (whO) => {
          whO`.*`, whO.deliveryForecast((dF) => dF`.*`);
        }
      );

      const deliveryStatistics = getDeliveryStatistics(
        whOrder.createdAt,
        whOrder.deliveryForecast.predictedDate,
        whOrder.deliveryForecast.actualDate
      );

      data[0].deliveryForecast.daysCounter = deliveryStatistics.daysCounter;
      data[0].deliveryForecast.residualPercentage =
        deliveryStatistics.residualPercentage;
      data[0].deliveryForecast.isCritical = deliveryStatistics.isCritical;
    }
  });
};
