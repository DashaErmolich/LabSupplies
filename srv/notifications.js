const { executeHttpRequest, buildCsrfHeaders } = require("@sap-cloud-sdk/core");
const { sendMail } = require("@sap-cloud-sdk/mail-client");
const { OrderStatuses, WhOrderStatuses } = require("./statuses");

function getFlpNotification(orderStatusID, title, recipientEmail) {
  let notificationTypeKey = "OrderReview";
  let priority = "Medium";

  switch (orderStatusID) {
    case OrderStatuses.ApproveWaiting:
      notificationTypeKey = "OrderReview";
      priority = "Medium";
      break;
    case OrderStatuses.Rejected:
      notificationTypeKey = "OrderReject";
      priority = "Hight";
      break;
    case OrderStatuses.EditWaiting:
      notificationTypeKey = "OrderEdit";
      priority = "Medium";
      break;
    case OrderStatuses.Closed:
      notificationTypeKey = "OrderCompleted";
      priority = "Low";
      break;
    case OrderStatuses.DeliveryWaiting:
      notificationTypeKey = "OrderPacking";
      priority = "Medium";
      break;
    case WhOrderStatuses.DeliveryInProgress:
      notificationTypeKey = "OrderDelivery";
      priority = "Medium";
      break;
  }
  return {
    OriginId: "LabSupplies",
    NotificationTypeKey: notificationTypeKey,
    NotificationTypeVersion: "2.2",
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
    case OrderStatuses.ApproveWaiting:
      message = `<p>${contactFrom.fullName} (${contactFrom.email}) requested approve for <b>Order ${orderTitle}</b> by ${contactTo.fullName}.</p>`;
      status = "Approve Request";
      break;
    case OrderStatuses.Rejected:
      message = `<p>${contactFrom.fullName} (${
        contactFrom.email
      }) has rejected and closed <b>Order ${orderTitle}</b> created by ${
        contactTo.fullName
      }.</p>
      <br>
      <p>Notes by ${contactFrom.fullName}: ${reviewerNotes || "none"}.</p>`;
      status = "Reject";
      break;
    case OrderStatuses.EditWaiting:
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
    case OrderStatuses.Closed:
      message = ` <b>Order ${orderTitle}</b> is delivered.</p>`;
      status = "Completed";
      break;
    case OrderStatuses.DeliveryWaiting:
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
    case WhOrderStatuses.DeliveryInProgress:
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
  let notification = getFlpNotification(
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

module.exports = { sendNotifications };