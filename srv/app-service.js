const cds = require("@sap/cds");
const { removeDuplicates } = require("./utils");
const PDFServicesSdk = require("@adobe/pdfservices-node-sdk"),
  fs = require("fs");
const { Readable, Writable, PassThrough } = require("stream");
path = require("path");

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
        status_ID: "WAITING_FOR_DELIVERY",
      });
    } catch (error) {
      console.log(error);
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
      console.log(error);
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
        console.log(error);
      }
    }

    if (req.data.statusID === "REJECTED" || req.data.statusID === "CLOSED") {
      const prevOrderItems = await SELECT.from(OrderItems).where({
        order_ID: orderID,
      });

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
          console.log(error);
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
      const whOrderItems = order.items
        .filter((item) => item.item_warehouse_ID === whIDs[i])
        .map((item) => ({ ...item, status_ID: "WAITING_FOR_COLLECTION" }));
      const whOrderTitle = `${order.title}-${warehouses
        .find((wh) => wh.ID === whIDs[i])
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
      };

      await INSERT.into(WarehouseOrders, whOrder);
    }
  });

  this.on("READ", "WarehouseOrderItems", async (req, next) => {
    console.log(req.req.originalUrl);

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

      // Setup input data for the document merge process
      const jsonString = fs.readFileSync(
          path.resolve(__dirname, "salesOrder.json")
        ),
        jsonDataForMerge = JSON.parse(jsonString);

      // Create an ExecutionContext using credentials
      const executionContext =
        PDFServicesSdk.ExecutionContext.create(credentials);

      // Create a new DocumentMerge options instance
      const documentMerge = PDFServicesSdk.DocumentMerge,
        documentMergeOptions = documentMerge.options,
        options = new documentMergeOptions.DocumentMergeOptions(
          jsonDataForMerge,
          documentMergeOptions.OutputFormat.PDF
        );

      // Create a new operation instance using the options instance
      const documentMergeOperation = documentMerge.Operation.createNew(options);

      // Set operation input document template from a source file.
      const input = PDFServicesSdk.FileRef.createFromLocalFile(
        path.resolve(__dirname, "salesOrderTemplate.docx")
      );
      documentMergeOperation.setInput(input);

      //Generating a file name
      // let outputFilePath = createOutputFilePath();

      // Execute the operation and Save the result to the specified location.
      const result = await documentMergeOperation.execute(executionContext);
      // await result.saveAsFile(outputFilePath);

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
          // content.pipe(stream)
        });
      }

      console.log(1);
      // .then((result) => result.saveAsFile(outputFilePath))
      // .catch((err) => {
      //   if (
      //     err instanceof PDFServicesSdk.Error.ServiceApiError ||
      //     err instanceof PDFServicesSdk.Error.ServiceUsageError
      //   ) {
      //     console.log("Exception encountered while executing operation", err);
      //   } else {
      //     console.log("Exception encountered while executing operation", err);
      //   }
      // });

      //Generates a string containing a directory structure and file name for the output file.
      // function createOutputFilePath() {
      //   let date = new Date();
      //   let dateString =
      //     date.getFullYear() +
      //     "-" +
      //     ("0" + (date.getMonth() + 1)).slice(-2) +
      //     "-" +
      //     ("0" + date.getDate()).slice(-2) +
      //     "T" +
      //     ("0" + date.getHours()).slice(-2) +
      //     "-" +
      //     ("0" + date.getMinutes()).slice(-2) +
      //     "-" +
      //     ("0" + date.getSeconds()).slice(-2);
      //   return "output/MergeDocumentToPDF/merge" + dateString + ".pdf";
      // }
    } catch (err) {
      console.log("Exception encountered while executing operation", err);
    }
  });
};
