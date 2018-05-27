'use strict';

const isEventInAggregate = function (aggregate, eventName) {
  if (!eventName) {
    return true;
  }

  return Object.keys(aggregate.events).some(event => event === eventName);
};

const isEventInContext = function (context, aggregateName, eventName) {
  if (!aggregateName && !eventName) {
    return true;
  }

  if (aggregateName) {
    if (!context[aggregateName]) {
      return false;
    }

    return isEventInAggregate(context[aggregateName], eventName);
  }

  for (const aggregate in context) {
    if (isEventInAggregate(context[aggregate], eventName)) {
      return true;
    }
  }

  return false;
};

const isEventInWriteModel = function (writeModel, contextName, aggregateName, eventName) {
  if (!contextName && !aggregateName && !eventName) {
    return true;
  }

  if (contextName) {
    if (!writeModel[contextName]) {
      return false;
    }

    return isEventInContext(writeModel[contextName], aggregateName, eventName);
  }

  for (const context in writeModel) {
    if (isEventInContext(writeModel[context], aggregateName, eventName)) {
      return true;
    }
  }

  return false;
};

const isEventIn = function (writeModel, event) {
  if (!event) {
    return true;
  }

  const contextName = event.context ? event.context.name : undefined;
  const aggregateName = event.aggregate ? event.aggregate.name : undefined;
  const eventName = event.name;

  return isEventInWriteModel(writeModel, contextName, aggregateName, eventName);
};

module.exports = isEventIn;
