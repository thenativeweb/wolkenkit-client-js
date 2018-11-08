'use strict';

const { only } = require('wolkenkit-command-tools');

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
      joinAndReject: { forPublic: true },
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
    (peerGroup, command) => {
      peerGroup.events.publish('started', {
        initiator: command.data.initiator,
        destination: command.data.destination
      });

      peerGroup.events.publish('joined', {
        participant: command.data.initiator
      });
    }
  ],

  join: [
    only.ifExists(),
    (peerGroup, command) => {
      if (wasAlreadyJoinedBy(peerGroup, command.data.participant)) {
        return command.reject('Participant had already joined.');
      }

      peerGroup.events.publish('joined', {
        participant: command.data.participant
      });
    }
  ],

  joinAndFail () {
    throw new Error('Something, somewhere went horribly wrong...');
  },

  joinAndReject (peerGroup, command) {
    command.reject('Something, somewhere went horribly wrong...');
  },

  publishForPublic (peerGroup) {
    peerGroup.events.publish('publishedForPublic');
  },

  publishForAuthenticated (peerGroup) {
    peerGroup.events.publish('publishedForAuthenticated');
  },

  publishForOwner (peerGroup) {
    peerGroup.events.publish('publishedForOwner');
  },

  triggerFlow (peerGroup) {
    peerGroup.events.publish('triggeredFlow');
  },

  notifyFromFlow (peerGroup) {
    peerGroup.events.publish('notifiedFromFlow');
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
