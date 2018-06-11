'use strict';

const browsers = {
  local: [
    { browserName: 'Chrome' }
  ],
  saucelabs: [
    { browserName: 'Chrome', platform: 'Windows 10', version: 'latest' },
    { browserName: 'Firefox', platform: 'Linux', version: 'latest' },
    { browserName: 'Safari', platform: 'macOS 10.13', version: 'latest' },
    { browserName: 'Internet Explorer', platform: 'Windows 10', version: 'latest' },
    { browserName: 'MicrosoftEdge', platform: 'Windows 10', version: 'latest' },

    // The iOS tests are currently disabled, as there are major problems with
    // sending key strokes.
    // { browserName: 'Safari', deviceName: 'iPhone Simulator', deviceOrientation: 'portrait', platformName: 'iOS', platformVersion: '11.3' },

    { browserName: 'Chrome', deviceName: 'Android Emulator', deviceOrientation: 'portrait', platformName: 'Android', platformVersion: '6.0' }
  ]
};

module.exports = browsers;
