const path = require("path");
const fs = require("fs");

const {
  ServicePrincipalCredentials,
  PDFServices,
  MimeType,
  DocumentMergeParams,
  OutputFormat,
  DocumentMergeJob,
  DocumentMergeResult,
  SDKError,
  ServiceUsageError,
  ServiceApiError
} = require("@adobe/pdfservices-node-sdk");

const PDF_TEMPLATE_PATHS = {
  whOrderReport: "sources/WhOrderReport.docx",
  productLabel: "sources/WhOrderItemPackingLabel.docx",
};

async function getPdfReportStream(jsonDataForMerge, templatePath) {
  let readStream;

  try {
    // Initial setup, create credentials instance
  const credentials = new ServicePrincipalCredentials({
    clientId: process.env.PDF_SERVICES_CLIENT_ID,
    clientSecret: process.env.PDF_SERVICES_CLIENT_SECRET
  });

  // Creates a PDF Services instance
  const pdfServices = new PDFServices({credentials});

  // Creates an asset(s) from source file(s) and upload
  readStream = fs.createReadStream(path.resolve(__dirname, templatePath));
  const inputAsset = await pdfServices.upload({
    readStream,
    mimeType: MimeType.DOCX
  });

  // Create parameters for the job
  const params = new DocumentMergeParams({
    jsonDataForMerge,
    outputFormat: OutputFormat.PDF
  });

  // Creates a new job instance
  const job = new DocumentMergeJob({inputAsset, params});

  // Submit the job and get the job result
  const pollingURL = await pdfServices.submit({job});
  const pdfServicesResponse = await pdfServices.getJobResult({
      pollingURL,
      resultType: DocumentMergeResult
  });

  // Get content from the resulting asset(s)
  const resultAsset = pdfServicesResponse.result.asset;
  const streamAsset = await pdfServices.getContent({asset: resultAsset});

  return streamAsset.readStream;
  } catch (err) {
    if (err instanceof SDKError || err instanceof ServiceUsageError || err instanceof ServiceApiError) {
      console.log("Exception encountered while executing operation", err);
    } else {
      console.log("Exception encountered while executing operation", err);
    }
  } finally {
    readStream?.destroy();
  }
}

module.exports = { PDF_TEMPLATE_PATHS, getPdfReportStream };
