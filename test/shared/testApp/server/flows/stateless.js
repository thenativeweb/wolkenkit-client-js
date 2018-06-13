'use strict';

const when = {
  'planning.peerGroup.triggeredFlow' (event, services, mark) {
    const app = services.get('app');

    app.planning.peerGroup(event.aggregate.id).notifyFromFlow();

    mark.asDone();
  }
};

module.exports = { when };
