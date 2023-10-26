const { executeHttpRequest, buildCsrfHeaders } = require("@sap-cloud-sdk/core");
const { sendMail } = require("@sap-cloud-sdk/mail-client");

function removeDuplicates(array) {
  return [...new Set(array)];
}

async function postNotification(notification) {
  const notificationEndpoint = "v2/Notification.svc";
  const csrfHeaders = await buildCsrfHeaders(
    { destinationName: "FLP-notification-service" },
    { url: notificationEndpoint }
  );
  const response = await executeHttpRequest(
    { destinationName: "FLP-notification-service" },
    {
      url: `${notificationEndpoint}/Notifications`,
      method: "post",
      data: notification,
      headers: csrfHeaders,
    }
  );
  return response.data.d;
}

function createNotification(orderStatusID, title, recipientEmail) {
  let notificationTypeKey = "OrderReview";
  let priority = "Medium";

  switch (orderStatusID) {
    case "WAITING_FOR_APPROVE":
      notificationTypeKey = "OrderReview";
      priority = "Medium";
      break;
    case "REJECTED":
      notificationTypeKey = "OrderReject";
      priority = "Hight";
      break;
    case "WAITING_FOR_EDIT":
      notificationTypeKey = "OrderEdit";
      priority = "Medium";
      break;
    case "CLOSED":
      notificationTypeKey = "OrderCompleted";
      priority = "Low";
      break;
    case "WAITING_FOR_DELIVERY":
      notificationTypeKey = "OrderPacking";
      priority = "Medium";
      break;
    case "DELIVERY_IN_PROGRESS":
      notificationTypeKey = "OrderDelivery";
      priority = "Medium";
      break;
  }
  return {
    OriginId: "LabSupplies",
    NotificationTypeKey: notificationTypeKey,
    NotificationTypeVersion: "2.1",
    NavigationTargetAction: "display",
    NavigationTargetObject: "masterDetail",
    Priority: priority,
    ProviderId: "",
    ActorId: "",
    ActorType: "",
    ActorDisplayText: "",
    ActorImageURL: "",
    Properties: [
      {
        Key: "orderTitle",
        Language: "en",
        Value: title,
        Type: "String",
        IsSensitive: false,
      },
    ],
    Recipients: [
      {
        RecipientId: recipientEmail,
      },
    ],
  };
}

function setOrderStatus(reqData, statusID) {
  reqData.status_ID = statusID;
  return;
}

function setOrderProcessor(reqData, processorEmail) {
  reqData.processor_email = processorEmail;
  return;
}

async function getOrdersCount(entity) {
  const query = SELECT.from(entity).limit(1);
  query.SELECT.count = true;
  const orderWithCount = await cds.run(query);
  return orderWithCount["$count"];
}

async function getOrderTitle(entity, titleKey) {
  let count = await getOrdersCount(entity);
  const orderNum = `${++count}`.padStart(3, "0");
  return `${titleKey}-${orderNum}`;
}

function setOrderTitle(reqData, orderTitle) {
  reqData.title = orderTitle;
  return;
}

async function getContact(entity, email) {
  return await SELECT.one.from(entity, email);
}

function getEmailConfig(
  orderStatusID,
  contactFrom,
  contactTo,
  orderTitle,
  reviewerNotes
) {
  let message = "";
  let status = "";

  switch (orderStatusID) {
    case "WAITING_FOR_APPROVE":
      message = `<p>${contactFrom.fullName} (${contactFrom.email}) requested approve for <b>Order ${orderTitle}</b> by ${contactTo.fullName}.</p>`;
      status = "Approve Request";
      break;
    case "REJECTED":
      message = `<p>${contactFrom.fullName} (${
        contactFrom.email
      }) has rejected and closed <b>Order ${orderTitle}</b> created by ${
        contactTo.fullName
      }.</p>
      <br>
      <p>Notes by ${contactFrom.fullName}: ${reviewerNotes || "none"}.</p>`;
      status = "Reject";
      break;
    case "WAITING_FOR_EDIT":
      message = `
      <p>${contactFrom.fullName} (${
        contactFrom.email
      }) requested edit of <b>Order ${orderTitle}</b> by ${
        contactTo.fullName
      }.</p>
      <br>
      <p>Notes by ${contactFrom.fullName}: ${reviewerNotes || "none"}.</p>`;
      status = "Edit Request";
      break;
    case "CLOSED":
      message = ` <b>Order ${orderTitle}</b> is delivered.</p>`;
      status = "Completed";
      break;
    case "WAITING_FOR_DELIVERY":
      message = `
      <p>${contactFrom.fullName} (${
        contactFrom.email
      }) approved <b>Order ${orderTitle}</b> by ${
        contactTo.fullName
      } and redirected related orders to warehouses.</p>
      <br>
      <p>Notes by ${contactFrom.fullName}: ${reviewerNotes || "none"}.</p>`;
      status = "In Packing";
      break;
    case "DELIVERY_IN_PROGRESS":
      message = `
      <p>${contactFrom.fullName} (${
        contactFrom.email
      }) started delivery of <b>Order ${orderTitle}</b>.</p>
      <br>
      <p>Notes by ${contactFrom.fullName}: ${reviewerNotes || "none"}.</p>`;
      status = "In Delivery";
      break;
  }

  const mailConfig = {
    from: "labsupplies.notification@example.com",
    to: `${contactTo.email}`,
    subject: `Order ${orderTitle} ${status}`,
    text: `
      <div>
        ${message}
      <p>This mail was send automatically by LabSupplies application, do not reply on it.</p>
    </div>
    `,
  };
  return mailConfig;
}

async function sendNotifications(
  orderStatusID,
  orderTitle,
  contactFrom,
  contactTo,
  reviewNotes
) {
  let mailConfig = getEmailConfig(
    orderStatusID,
    contactFrom,
    contactTo,
    orderTitle,
    reviewNotes
  );
  let notification = createNotification(
    orderStatusID,
    orderTitle,
    contactTo.email
  );

  try {
    await sendMail({ destinationName: "MailBrevo" }, [mailConfig]);
  } catch (error) {
    throw new Error(`Sorry, email was not been sent to ${user.manager.email}.`);
  }

  try {
    await postNotification(notification);
  } catch (error) {
    throw new Error(
      `Sorry, notification was not been sent to ${user.manager.email}.`
    );
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function getRandomBoolean(probability) {
  return Math.random() < probability;
}

function getDays(dateString) {
  return dateString
    ? Math.floor(new Date(dateString).getTime() / 60000)
    : Math.floor(new Date().getTime() / 60000);
}

function getDeliveryStatistics(created, predicted, actual) {
  const MS_MIN = 60000;

  const creationTime = new Date(created).getTime();
  const predictedTime = new Date(predicted).getTime();
  const actualTime = new Date(actual).getTime() || new Date().getTime();

  const predictedDate = new Date(predictedTime - creationTime);
  const predictedDays = Math.floor(predictedDate / MS_MIN);
  const actualDate = new Date(actualTime - creationTime);
  const daysCounter = Math.floor(actualDate / MS_MIN);

  const residualPercentage = (
    ((daysCounter - predictedDays) / (predictedDays || 1)) *
    100
  ).toFixed(2);
  const isCritical = residualPercentage > 0;

  return {
    residualPercentage: Math.abs(residualPercentage),
    daysCounter: Math.abs(daysCounter),
    isCritical: isCritical,
    criticalityName: isCritical ? "Error" : "Good",
    trend: isCritical ? "Up" : "Down",
  };
}

module.exports = {
  getDeliveryStatistics,
  getDays,
  getRandomBoolean,
  getRandomInt,
  sendNotifications,
  removeDuplicates,
  postNotification,
  createNotification,
  setOrderStatus,
  setOrderProcessor,
  setOrderTitle,
  getOrderTitle,
  getContact,
};
