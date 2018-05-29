'use strict';

const wolkenkit = require('wolkenkit-client');

global.wolkenkit = wolkenkit;

global.openIdConnect = new wolkenkit.authentication.OpenIdConnect({
  identityProviderUrl: 'https://thenativeweb.eu.auth0.com/authorize',
  clientId: 'WvIrIAGnMfEhi6b6vTnScKo6Ccw0yQ1Y',
  scope: 'profile',
  redirectUrl: 'http://localhost:4567/authentication/',
  strictMode: true
});

global.document.body.innerHTML = '<div id="log"></div>';
