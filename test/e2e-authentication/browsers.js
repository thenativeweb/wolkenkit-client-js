'use strict';

const browsers = {
  local: [
    { browserName: 'chrome' }
  ],
  cloud: [
    { browserName: 'chrome', platform: 'Linux', version: 'latest' },
    { browserName: 'chrome', platform: 'macOS 10.12', version: 'latest' },
    { browserName: 'chrome', platform: 'Windows 10', version: 'latest' },
    { browserName: 'firefox', platform: 'Linux', version: 'latest' },
    { browserName: 'firefox', platform: 'macOS 10.12', version: 'latest' },
    { browserName: 'firefox', platform: 'Windows 10', version: 'latest' },
    { browserName: 'internet explorer', platform: 'Windows 10', version: 'latest' },
    { browserName: 'microsoftedge', platform: 'Windows 10', version: 'latest' }
  ]
};

module.exports = browsers;
