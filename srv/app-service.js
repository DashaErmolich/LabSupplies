const cds = require("@sap/cds");
const { removeDuplicates, postNotification, createNotification } = require("./utils");
const PDFServicesSdk = require("@adobe/pdfservices-node-sdk"),
  fs = require("fs");
const { Readable, Writable, PassThrough } = require("stream");
path = require("path");
const QRCode = require('qrcode');

const TEST_EMAIL = 'dasha.ermolich@gmail.com'

const { sendMail, MailConfig } = require('@sap-cloud-sdk/mail-client');

module.exports = function (srv) {
  const {
    Orders,
    OrderItems,
    WarehouseProducts,
    Contacts,
    Warehouses,
    WarehouseOrders,
    WarehouseOrderItems,
  } = srv.entities;

  this.before("NEW", Orders.drafts, async (req) => {
    req.data.status_ID = "OPENED";
    req.data.processor_email = req.user.id;
  });

  this.before("CREATE", Orders, async (req) => {
    const data = new Date();
    req.data.title = `SO${data.getDate()}/${data.getMinutes()}`;
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
          req.error({
            message: 'Something bad happened. Check order products.'
          })
        }
      }
    } else {
      req.error({
        message: "Some items are unavailable",
      });
    }

    return next();
  });

  this.after("SAVE", Orders, async (order, req) => {
    const managerContact = await SELECT.one
    .from(Contacts)
    .where({ email: order.processor_email });


    const userContact = await SELECT.one
    .from(Contacts)
    .where({ email: req.user.id });

    const mailConfig = {
      from: 'labsupplies.notification@example.com',
      to: `${managerContact.email}`,
      //to: 'viachaslav.rutkovskiy@gmail.com',
      subject: `Order ${order.title} review`,
      text: `
      <div>
        <p>${userContact.fullName} (${userContact.email}) requested approve for <b>Order ${order.title}</b> by ${managerContact.fullName}.</p>

        This mail was send automatically by LabSupplies application, do not reply on it.
      </div>
      `
    };

    await sendMail({ destinationName: 'MailBrevo' }, [mailConfig]);
    await postNotification(createNotification(order.title, TEST_EMAIL));
  })

  this.before("SAVE", Orders, async (req) => {
    const userID = req.user.id;

    const userContact = await SELECT.one
      .from(Contacts)
      .where({ email: userID });

    req.data.processor_email = userContact.manager_email;
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

  this.before("UPDATE", OrderItems.drafts, async (req) => {
    const item = await SELECT.from(OrderItems.drafts, req.data.ID);
    const items = await SELECT.from(OrderItems.drafts).where({order_ID: item.order_ID});
    const a =  items.filter((v) => v.item_product_ID !== item.item_product_ID && v.item_warehouse_ID !== item.item_warehouse_ID).length < items.length - 1;

    if (a) {
      req.error({
        message: "this Item already exists in list",
        target: 'item_product_ID',
      })
    }
  });

  this.on("approveOrder", async (req) => {
    const orderID = req.params[0].ID;

    try {
      await UPDATE(Orders, {
        ID: orderID,
      }).with({
        status_ID: "WAITING_FOR_DELIVERY",
      });
    } catch (error) {
      req.error({
        message: 'Something bad happened. Check order.'
      })
    }
  });

  this.on("rejectOrder", async (req) => {
    const orderID = req.params[0].ID;

    try {
      await UPDATE(Orders, {
        ID: orderID,
      }).with({
        status_ID: req.data.statusID,
        reviewNotes: req.data.notes,
      });
    } catch (error) {
      req.error({
        message: 'Something bad happened. Check order.'
      })
    }

    if (req.data.statusID === "WAITING_FOR_EDIT") {
      try {
        const order = await SELECT.one.from(Orders).where({
          ID: orderID,
        });
        await UPDATE(Orders, {
          ID: orderID,
        }).with({
          processor_email: order.createdBy,
        });
      } catch (error) {
        req.error({
          message: 'Something bad happened. Check order.'
        })
      }
    }

    if (req.data.statusID === "REJECTED" || req.data.statusID === "CLOSED") {
      const prevOrderItems = await SELECT.from(OrderItems).where({
        order_ID: orderID,
      });

      await UPDATE(Orders, orderID).with({
        isEditable: false,
      })

      const final = [];

      for (let i = 0; i < prevOrderItems.length; i++) {
        const item = prevOrderItems[i];
        const data = await SELECT(WarehouseProducts, {
          warehouse_ID: item.item_warehouse_ID,
          product_ID: item.item_product_ID,
        });

        final.push({
          listItem: item,
          whItem: data,
        });
      }

      for (let i = 0; i < final.length; i++) {
        const item = final[i];
        try {
          await UPDATE(WarehouseProducts, {
            warehouse_ID: item.listItem.item_warehouse_ID,
            product_ID: item.listItem.item_product_ID,
          }).with({
            stock: item.whItem.stock + item.listItem.qty,
          });
        } catch (error) {
          req.error({
            message: 'Something bad happened. Check order.'
          })
        }
      }
    }
  });

  this.after("READ", Orders, (data, req) => {
    if (data.length) {
      let isReviewerRole = req.user.is("Reviewer");
      let isApproveButtonHidden = true;
      let isRejectButtonHidden = true;

      if (isReviewerRole) {
        if (
          data[0]?.status?.ID !== "REJECTED" ||
          data[0]?.status?.ID !== "WAITING_FOR_DELIVERY"
        ) {
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
        });
    });

    for (let i = 0; i < whIDs.length; i++) {
      const wh = warehouses.find((wh) => wh.ID === whIDs[i]);

      const whOrderItems = order.items
        .filter((item) => item.item_warehouse_ID === whIDs[i])
        .map((item) => ({ ...item, status_ID: "WAITING_FOR_COLLECTION" }));
      const whOrderTitle = `${order.title}-${wh
        .name.split(" ")
        .join("/")}`;
      const contacts = warehouses.find((wh) => wh.ID === whIDs[i]).contacts;

      const whOrder = {
        title: whOrderTitle,
        items: whOrderItems,
        parentOrder_ID: orderID,
        status_ID: "PACKING",
        processor_email: contacts.sort(
          (a, b) => a.orders.length - b.orders.length
        )[0].email,
        warehouse_ID: wh.ID,
      };

      await INSERT.into(WarehouseOrders, whOrder);
    }
  });

  this.on("READ", WarehouseOrderItems, async (req, next) => {
    if (!req.data.ID || !req.req.originalUrl.includes("content")) {
      return next();
    }

    try {
      // Initial setup, create credentials instance.
      const credentials =
        PDFServicesSdk.Credentials.servicePrincipalCredentialsBuilder()
          .withClientId(process.env.PDF_SERVICES_CLIENT_ID)
          .withClientSecret(process.env.PDF_SERVICES_CLIENT_SECRET)
          .build();
      
      const labelData = await SELECT.one.from(WarehouseOrderItems, req.data.ID, (whItem) => {
        whItem.qty, whItem.item((item) => {
          item.warehouse((wh) => {
            wh.name, wh.address((whAddress) => {
              whAddress`.*`
            })
          }),
          item.product((product) => {
            product`.*`, product.category((cat) => {
              cat.name
            })
          })
        }),
        whItem.order((order) => {
          order.title, order.createdAt, order.parentOrder((pOrder) => {
            pOrder.processor_email, pOrder.title, pOrder.createdAt, pOrder.deliveryTo((dTo) => {
              dTo.name, dTo.address((address) => {
                address`.*`
              })
            })
          })
        })
      })


      labelData.logo = await QRCode.toDataURL(`${req.data.ID}`, { errorCorrectionLevel: 'H' });
      labelData.timestamp = (new Date()).toString()

      // Create an ExecutionContext using credentials
      const executionContext =
        PDFServicesSdk.ExecutionContext.create(credentials);

      // Create a new DocumentMerge options instance
      const documentMerge = PDFServicesSdk.DocumentMerge,
        documentMergeOptions = documentMerge.options,
        options = new documentMergeOptions.DocumentMergeOptions(
          labelData,
          documentMergeOptions.OutputFormat.PDF
        );

      // Create a new operation instance using the options instance
      const documentMergeOperation = documentMerge.Operation.createNew(options);

      // Set operation input document template from a source file.
      const input = PDFServicesSdk.FileRef.createFromLocalFile(
        path.resolve(__dirname, "WhOrderItemPackingLabel.docx")
      );
      documentMergeOperation.setInput(input);

      // Execute the operation and Save the result to the specified location.
      const result = await documentMergeOperation.execute(executionContext);
      const stream = new Readable();
      await _streamToData(stream, result);

      const resultOutput = new Array();
      resultOutput.push({
        value: stream,
      });
      return resultOutput;

      async function _streamToData(outStream, result) {
        return new Promise((resolve) => {
          const str = new PassThrough();
          result.writeToStream(str);

          str.on("data", (chunk) => {
            outStream.push(chunk);
          });
          str.on("end", () => {
            outStream.push(null);
            resolve(true);
          });
        });
      }
    } catch (err) {
      req.err({
        message: 'Something bad happened. Unable to load label.'
      })
    }
  });
};
