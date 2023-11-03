const { executeHttpRequest, buildCsrfHeaders } = require("@sap-cloud-sdk/core");
const { sendMail } = require("@sap-cloud-sdk/mail-client");
const { OrderStatuses, WhOrderStatuses } = require("./statuses");

const ORDER_NOTIFICATIONS = [
  {
    id: OrderStatuses.EditWaiting,
    flp: {
      notificationTypeKey: "OrderEdit",
      priority: "Medium",
    },
    email: {
      message: function (contactFrom, contactTo, reviewerNotes, orderTitle) {
        return `
      <p>${contactFrom.fullName} (${
          contactFrom.email
        }) requested edit of <b>Order ${orderTitle}</b> by ${
          contactTo.fullName
        }.</p>
      <br>
      <p>Notes by ${contactFrom.fullName}: ${reviewerNotes || "none"}.</p>`;
      },
      status: "Edit Request",
      emoji: "✏️",
    },
  },
  {
    id: OrderStatuses.ApproveWaiting,
    flp: {
      notificationTypeKey: "OrderReview",
      priority: "Medium",
    },
    email: {
      message: function (contactFrom, contactTo, reviewerNotes, orderTitle) {
        return `<p>${contactFrom.fullName} (${contactFrom.email}) requested approve for <b>Order ${orderTitle}</b> by ${contactTo.fullName}.</p>`;
      },
      status: "Approve Request",
      emoji: "☑️",
    },
  },
  {
    id: OrderStatuses.DeliveryWaiting,
    flp: {
      notificationTypeKey: "OrderPacking",
      priority: "Medium",
    },
    email: {
      message: function (contactFrom, contactTo, reviewerNotes, orderTitle) {
        return `
      <p>${contactFrom.fullName} (${
          contactFrom.email
        }) approved <b>Order ${orderTitle}</b> by ${
          contactTo.fullName
        } and redirected related orders to warehouses.</p>
      <br>
      <p>Notes by ${contactFrom.fullName}: ${reviewerNotes || "none"}.</p>`;
      },
      status: "In Packing",
      emoji: "📦",
    },
  },
  {
    id: OrderStatuses.Rejected,
    flp: {
      notificationTypeKey: "OrderReject",
      priority: "Hight",
    },
    email: {
      message: function (contactFrom, contactTo, reviewerNotes, orderTitle) {
        return `<p>${contactFrom.fullName} (${
          contactFrom.email
        }) has rejected and closed <b>Order ${orderTitle}</b> created by ${
          contactTo.fullName
        }.</p>
        <br>
        <p>Notes by ${contactFrom.fullName}: ${reviewerNotes || "none"}.</p>`;
      },
      status: "Reject",
      emoji: "❌",
    },
  },
  {
    id: OrderStatuses.Closed,
    flp: {
      notificationTypeKey: "OrderCompleted",
      priority: "Low",
    },
    email: {
      message: function (contactFrom, contactTo, reviewerNotes, orderTitle) {
        return ` <b>Order ${orderTitle}</b> is delivered.</p>`;
      },
      status: "Completed",
      emoji: "✅",
    },
  },
];

const WH_ORDER_NOTIFICATIONS = [
  {
    id: WhOrderStatuses.DeliveryInProgress,
    flp: {
      notificationTypeKey: "OrderDelivery",
      priority: "Medium",
    },
    email: {
      message: function (contactFrom, contactTo, reviewerNotes, orderTitle) {
        return `
      <p>${contactFrom.fullName} (${
          contactFrom.email
        }) started delivery of <b>Order ${orderTitle}</b>.</p>
      <br>
      <p>Notes by ${contactFrom.fullName}: ${reviewerNotes || "none"}.</p>`;
      },
      status: "In Delivery",
      emoji: "🚚",
    },
  },
  {
    id: WhOrderStatuses.Delivered,
    flp: {
      notificationTypeKey: "OrderDelivered",
      priority: "Low",
    },
    email: {
      message: function (contactFrom, contactTo, reviewerNotes, orderTitle) {
        return `
      <p><b>Order ${orderTitle}</b> is delivered.</p>
      <br>
      <p>Notes by ${contactFrom.fullName}: ${reviewerNotes || "none"}.</p>`;
      },
      status: "Delivered",
      emoji: "✔️",
    },
  },
];

function getFlpNotification(orderStatusID, title, recipientEmail) {
  let notificationData = [
    ...ORDER_NOTIFICATIONS,
    ...WH_ORDER_NOTIFICATIONS,
  ].find((item) => item.id === orderStatusID).flp;

  return {
    OriginId: "LabSupplies",
    NotificationTypeKey: notificationData.notificationTypeKey,
    NotificationTypeVersion: "2.2",
    NavigationTargetAction: "display",
    NavigationTargetObject: "masterDetail",
    Priority: notificationData.priority,
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
  let emailData = [...ORDER_NOTIFICATIONS, ...WH_ORDER_NOTIFICATIONS].find(
    (item) => item.id === orderStatusID
  ).email;

  const mailConfig = {
    from: "labsupplies.notification@example.com",
    to: `${contactTo.email}`,
    subject: `${emailData.emoji} Order ${orderTitle} ${emailData.status}`,
    text: `
      <div>
        ${emailData.message(contactFrom, contactTo, reviewerNotes, orderTitle)}
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
