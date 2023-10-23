const { executeHttpRequest, buildCsrfHeaders } = require("@sap-cloud-sdk/core");

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

module.exports = { removeDuplicates, postNotification, createNotification };