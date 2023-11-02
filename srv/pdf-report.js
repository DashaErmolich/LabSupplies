const PDFServicesSdk = require("@adobe/pdfservices-node-sdk");
const { Readable, PassThrough } = require("stream");
path = require("path");
const QRCode = require("qrcode");

const PDF_TEMPLATE_PATHS = {
  whOrderReport: "sources/WhOrderReport.docx",
  productLabel: "sources/WhOrderItemPackingLabel.docx",
};

async function getPdfReportStream(reportData, templatePath) {
  // Initial setup, create credentials instance.
  const credentials =
    PDFServicesSdk.Credentials.servicePrincipalCredentialsBuilder()
      .withClientId(process.env.PDF_SERVICES_CLIENT_ID)
      .withClientSecret(process.env.PDF_SERVICES_CLIENT_SECRET)
      .build();

  // Create an ExecutionContext using credentials
  const executionContext = PDFServicesSdk.ExecutionContext.create(credentials);

  // Create a new DocumentMerge options instance
  const documentMerge = PDFServicesSdk.DocumentMerge,
    documentMergeOptions = documentMerge.options,
    options = new documentMergeOptions.DocumentMergeOptions(
      reportData,
      documentMergeOptions.OutputFormat.PDF
    );

  // Create a new operation instance using the options instance
  const documentMergeOperation = documentMerge.Operation.createNew(options);

  // Set operation input document template from a source file.
  const input = PDFServicesSdk.FileRef.createFromLocalFile(
    path.resolve(__dirname, templatePath)
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
}

module.exports = { PDF_TEMPLATE_PATHS, getReportStream: getPdfReportStream };
