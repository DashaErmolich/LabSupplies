const { executeHttpRequest, buildCsrfHeaders } = require("@sap-cloud-sdk/core");
const { sendMail } = require('@sap-cloud-sdk/mail-client');

function removeDuplicates(array) {
  return [... new Set(array)];
}

async function postNotification(notification) {
  const notificationEndpoint = "v2/Notification.svc";
  const csrfHeaders = await buildCsrfHeaders({ destinationName:  'FLP-notification-service'}, { url: notificationEndpoint });
  const response = await executeHttpRequest({ destinationName:  'FLP-notification-service'}, {
      url: `${notificationEndpoint}/Notifications`,
      method: "post",
      data: notification,
      headers: csrfHeaders,
  });
  return response.data.d;
}

function createNotification(title, recipientEmail) {

  return {
    OriginId: "LabSupplies",
    NotificationTypeKey: "OrderReview",
    NotificationTypeVersion: "1.0",
    NavigationTargetAction: "display",
    NavigationTargetObject: "masterDetail",
    Priority: "High",
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
            IsSensitive: false
        }
    ],
    Recipients: [
    {
        RecipientId: recipientEmail
    }
]
}
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
  return orderWithCount['$count'];
}

async function getOrderTitle(entity, titleKey) {
  let count = await getOrdersCount(entity);
  const orderNum = `${count++}`.padStart(3, '0');
  return `${titleKey}-${orderNum}`;
}

function setOrderTitle(reqData, orderTitle) {
  reqData.title = orderTitle;
  return;
}

async function getContact(entity, email) {
  return await SELECT.one
  .from(entity, email)
}

function getEmailConfig(orderStatusID, contactFrom, contactTo, orderTitle, reviewerNotes) {
  let message = '';
  let status = '';

  switch(orderStatusID) {
    case 'WAITING_FOR_APPROVE':
      message = `<p>${contactFrom.fullName} (${contactFrom.email}) requested approve for <b>Order ${orderTitle}</b> by ${contactTo.fullName}.</p>`;
      status = 'Approve Request';
      break;
    case 'REJECTED':
      message = `<p>${contactFrom.fullName} (${contactFrom.email}) has rejected and closed <b>Order ${orderTitle}</b> created by ${contactTo.fullName}.</p>
      <br>
      <p>Notes by ${contactFrom.fullName}: ${reviewerNotes || 'none'}.</p>`;
      status = 'Reject';
      break;
    case 'WAITING_FOR_EDIT':
      message = `
      <p>${contactFrom.fullName} (${contactFrom.email}) requested edit of <b>Order ${orderTitle}</b> by ${contactTo.fullName}.</p>
      <br>
      <p>Notes by ${contactFrom.fullName}: ${reviewerNotes || 'none'}.</p>`;
      status = 'Edit Request';
      break;
    case 'CLOSED':
      message = ` <b>Order ${orderTitle}</b> is delivered.</p>`;
      status = 'Close';
      break;
    case 'WAITING_FOR_DELIVERY':
      message = `
      <p>${contactFrom.fullName} (${contactFrom.email}) approved <b>Order ${orderTitle}</b> by ${contactTo.fullName}.</p>
      <br>
      <p>Notes by ${contactFrom.fullName}: ${reviewerNotes || 'none'}.</p>`;
      status = 'In delivery';
      break;
    }

  const mailConfig = {
    from: 'labsupplies.notification@example.com',
    to: `${contactTo.email}`,
    subject: `Order ${orderTitle} ${status}`,
    text: `
      <div>
        ${message}
      <p>This mail was send automatically by LabSupplies application, do not reply on it.</p>
    </div>
    `
  }
  return mailConfig;
}


async function sendNotifications(orderStatusID, orderTitle, contactFrom, contactTo, reviewNotes) {
  let mailConfig = getEmailConfig(orderStatusID, contactFrom, contactTo, orderTitle, reviewNotes);
  let notification = createNotification(orderTitle, contactTo.email);

  try {
    await sendMail({ destinationName: 'MailBrevo' }, [mailConfig]);
  } catch (error) {
    throw new Error(`Sorry, email was not been sent to ${user.manager.email}.`)
  }

  try {
    await postNotification(notification);
  } catch (error) {
    throw new Error(`Sorry, notification was not been sent to ${user.manager.email}.`);
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

module.exports = { getRandomInt, sendNotifications, removeDuplicates, postNotification, createNotification, setOrderStatus, setOrderProcessor, setOrderTitle, getOrderTitle, getContact };