'use strict';

const reactions = {
  'planning.peerGroup.triggeredFlow' (event, { app }) {
    app.planning.peerGroup(event.aggregate.id).notifyFromFlow();
  }
};

module.exports = { reactions };
