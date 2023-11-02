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
  const MS_MIN = 60000;

  return dateString
    ? Math.floor(new Date(dateString).getTime() / MS_MIN)
    : Math.floor(new Date().getTime() / MS_MIN);
}

function getDeliveryStatistics(created, predicted, actual) {
  const predictedDays = getDays(predicted) - getDays(created);
  const daysCounter = getDays(actual) - getDays(created);

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
