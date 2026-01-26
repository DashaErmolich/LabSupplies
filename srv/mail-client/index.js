
const nodemailer = require("nodemailer");
const {
  getDestinationFromDestinationService,
} = require("@sap-cloud-sdk/connectivity");
const LOG = cds.log("lab-supplies-mail-client");

async function sendMail({ destinationName }, mailConfigs) {
  const { originalProperties } = await getDestinationFromDestinationService({
    destinationName,
  });
  const transport = {
    host: originalProperties["mail.smtp.host"],
    port: originalProperties["mail.smtp.port"],
    secure: false, // true for 465, false for other ports
    auth: {
      user: originalProperties["mail.user"],
      pass: originalProperties["mail.password"],
    },
  };
  let transporter = nodemailer.createTransport(transport);
  const from = {
    name: 'LabSupplies',
    address: originalProperties["mail.from"]
  };

  if (!from.address) {
    throw new Error('Destination configuration "mail.from" not found')
  }

  const response = [];
  for (const [mailConfigIndex, mailConfig] of mailConfigs.entries()) {
    try {
      LOG.debug(
        `Sending email ${mailConfigIndex + 1}/${mailConfigs.length}...`
      );
      response[mailConfigIndex] = await transporter.sendMail({
        ...mailConfig,
        from,
      });
      LOG.debug(
        `...email ${mailConfigIndex + 1}/${mailConfigs.length} with subject "${mailConfig.subject}" was sent successfully.`
      );
    } catch (error) {
      LOG.error(
        `Failed to send email ${mailConfigIndex + 1}/${mailConfigs.length} with subject "${mailConfig.subject}". Error: ${error.message}`
      );
      response[mailConfigIndex] = {
        response: error.response,
        rejected: error.rejected,
      };
    }
  }
  return response;
}

module.exports = {
  sendMail,
};
