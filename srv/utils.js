function removeDuplicates(array) {
  return [...new Set(array)];
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
  removeDuplicates,
  setOrderStatus,
  setOrderProcessor,
  setOrderTitle,
  getOrderTitle,
  getContact,
};
