'use strict';

var isEventInAggregate = function isEventInAggregate(aggregate, eventName) {
  if (!eventName) {
    return true;
  }

  return Object.keys(aggregate.events).some(function (event) {
    return event === eventName;
  });
};

var isEventInContext = function isEventInContext(context, aggregateName, eventName) {
  if (!aggregateName && !eventName) {
    return true;
  }

  if (aggregateName) {
    if (!context[aggregateName]) {
      return false;
    }

    return isEventInAggregate(context[aggregateName], eventName);
  }

  for (var aggregate in context) {
    if (isEventInAggregate(context[aggregate], eventName)) {
      return true;
    }
  }

  return false;
};

var isEventInWriteModel = function isEventInWriteModel(writeModel, contextName, aggregateName, eventName) {
  if (!contextName && !aggregateName && !eventName) {
    return true;
  }

  if (contextName) {
    if (!writeModel[contextName]) {
      return false;
    }

    return isEventInContext(writeModel[contextName], aggregateName, eventName);
  }

  for (var context in writeModel) {
    if (isEventInContext(writeModel[context], aggregateName, eventName)) {
      return true;
    }
  }

  return false;
};

var isEventIn = function isEventIn(writeModel, event) {
  if (!event) {
    return true;
  }

  var contextName = event.context ? event.context.name : undefined;
  var aggregateName = event.aggregate ? event.aggregate.name : undefined;
  var eventName = event.name;
  return isEventInWriteModel(writeModel, contextName, aggregateName, eventName);
};

module.exports = isEventIn;