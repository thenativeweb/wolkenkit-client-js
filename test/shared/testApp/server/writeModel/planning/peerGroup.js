'use strict';

const only = require('wolkenkit-command-tools').only;

const wasAlreadyJoinedBy = function (peerGroup, participant) {
  return peerGroup.state.participants.indexOf(participant) !== -1;
};

const initialState = {
  initiator: undefined,
  destination: undefined,
  participants: [],
  isAuthorized: {
    commands: {
      start: { forPublic: true },
      join: { forPublic: true },
      joinAndFail: { forPublic: true },
      publishForPublic: { forPublic: true },
      publishForAuthenticated: { forPublic: true },
      publishForOwner: { forPublic: true },
      triggerFlow: { forPublic: true },
      notifyFromFlow: { forPublic: true }
    },
    events: {
      started: { forPublic: true },
      joined: { forPublic: true },
      publishedForPublic: { forAuthenticated: true, forPublic: true },
      publishedForAuthenticated: { forAuthenticated: true, forPublic: false },
      publishedForOwner: { forAuthenticated: false, forPublic: false },
      triggeredFlow: { forAuthenticated: false, forPublic: false },
      notifiedFromFlow: { forPublic: true }
    }
  }
};

const commands = {
  start: [
    only.ifNotExists(),
    (peerGroup, command, mark) => {
      peerGroup.events.publish('started', {
        initiator: command.data.initiator,
        destination: command.data.destination
      });

      peerGroup.events.publish('joined', {
        participant: command.data.initiator
      });

      mark.asDone();
    }
  ],

  join: [
    only.ifExists(),
    (peerGroup, command, mark) => {
      if (wasAlreadyJoinedBy(peerGroup, command.data.participant)) {
        return mark.asRejected('Participant had already joined.');
      }

      peerGroup.events.publish('joined', {
        participant: command.data.participant
      });

      mark.asDone();
    }
  ],

  joinAndFail () {
    throw new Error('Something, somewhere went horribly wrong...');
  },

  publishForPublic (peerGroup, command, mark) {
    peerGroup.events.publish('publishedForPublic');
    mark.asDone();
  },

  publishForAuthenticated (peerGroup, command, mark) {
    peerGroup.events.publish('publishedForAuthenticated');
    mark.asDone();
  },

  publishForOwner (peerGroup, command, mark) {
    peerGroup.events.publish('publishedForOwner');
    mark.asDone();
  },

  triggerFlow (peerGroup, command, mark) {
    peerGroup.events.publish('triggeredFlow');
    mark.asDone();
  },

  notifyFromFlow (peerGroup, command, mark) {
    peerGroup.events.publish('notifiedFromFlow');
    mark.asDone();
  }
};

const events = {
  started (peerGroup, event) {
    peerGroup.setState({
      initiator: event.data.initiator,
      destination: event.data.destination
    });
  },

  joined (peerGroup, event) {
    peerGroup.state.participants.push(event.data.participant);
  },

  publishedForPublic () {},
  publishedForAuthenticated () {},
  publishedForOwner () {},
  triggeredFlow () {},
  notifiedFromFlow () {}
};

module.exports = { initialState, commands, events };
