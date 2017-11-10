module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("es6-promise");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("uuidv4");

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var https = __webpack_require__(14);

var request = function request(options, reqData, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!callback) {
    callback = reqData;
    reqData = undefined;
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  var hasErrored = false,
      onReqError = void 0,
      unsubscribeReq = void 0,
      unsubscribeRes = void 0;

  var req = https.request(options, function (res) {
    var body = '',
        onResData = void 0,
        onResEnd = void 0,
        onResError = void 0;

    unsubscribeRes = function unsubscribeRes() {
      res.removeListener('data', onResData);
      res.removeListener('end', onResEnd);
      res.removeListener('error', onResError);
    };

    onResData = function onResData(data) {
      body += data;
    };

    onResEnd = function onResEnd() {
      unsubscribeReq();
      unsubscribeRes();
      callback(null, { statusCode: res.statusCode, body: body });
    };

    onResError = function onResError(err) {
      if (hasErrored) {
        return;
      }
      hasErrored = true;

      unsubscribeReq();
      unsubscribeRes();
      res.resume();

      callback(err);
    };

    res.on('data', onResData);
    res.on('end', onResEnd);
    res.on('error', onResError);
  });

  unsubscribeReq = function unsubscribeReq() {
    req.removeListener('error', onReqError);
  };

  onReqError = function onReqError(err) {
    if (hasErrored) {
      return;
    }
    hasErrored = true;

    unsubscribeReq();
    callback(err);
  };

  req.on('error', onReqError);

  if (reqData) {
    req.write(reqData);
  }
  req.end();
};

module.exports = request;

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("stream");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var isNode = __webpack_require__(6),
    Promise = __webpack_require__(0).Promise;

var authenticationStrategies = __webpack_require__(7),
    getApp = __webpack_require__(10);

var appCache = {};

var wolkenkitClient = {
  authentication: authenticationStrategies,

  connect: function connect(options) {
    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.host) {
      throw new Error('Host is missing.');
    }

    var configuration = options.configuration,
        host = options.host,
        _options$port = options.port,
        port = _options$port === undefined ? 443 : _options$port,
        _options$protocol = options.protocol,
        protocol = _options$protocol === undefined ? isNode ? 'https' : 'wss' : _options$protocol,
        _options$authenticati = options.authentication,
        authentication = _options$authenticati === undefined ? new this.authentication.None() : _options$authenticati;


    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        var appKey = host + ':' + port;
        var app = appCache[appKey];

        if (app) {
          return resolve(app);
        }

        getApp({ host: host, port: port, protocol: protocol, authentication: authentication, configuration: configuration }).then(function (newApp) {
          appCache[appKey] = newApp;
          resolve(newApp);
        }).catch(reject);
      }, 0.05 * 1000);
    });
  },


  // Internal function, for tests only.
  reset: function reset(options) {
    options = options || {};
    options.keepLocalStorage = options.keepLocalStorage || false;

    Object.keys(appCache).forEach(function (appName) {
      appCache[appName].destroy(options);
    });

    appCache = {};
  }
};

module.exports = wolkenkitClient;

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("is-node");

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var None = __webpack_require__(8),
    OpenIdConnect = __webpack_require__(9);

var authentication = {
  None: None,
  OpenIdConnect: OpenIdConnect
};

module.exports = authentication;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var None = function () {
  function None() {
    _classCallCheck(this, None);
  }

  _createClass(None, [{
    key: 'login',
    value: function login() {
      this.onError(new Error('Invalid operation.'));
    }
  }, {
    key: 'logout',
    value: function logout() {
      this.onError(new Error('Invalid operation.'));
    }

    /* eslint-disable class-methods-use-this */

  }, {
    key: 'willAuthenticate',
    value: function willAuthenticate(proceed) {
      proceed();
    }
  }, {
    key: 'onAuthenticating',
    value: function onAuthenticating() {}
  }, {
    key: 'onAuthenticated',
    value: function onAuthenticated() {}
  }, {
    key: 'onError',
    value: function onError(err) {
      throw err;
    }
  }, {
    key: 'isLoggedIn',
    value: function isLoggedIn() {
      return false;
    }
  }, {
    key: 'getToken',
    value: function getToken() {
      return undefined;
    }
  }, {
    key: 'getProfile',
    value: function getProfile() {
      return undefined;
    }
    /* eslint-enable class-methods-use-this */

  }]);

  return None;
}();

module.exports = None;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/* global window */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var uuid = __webpack_require__(2);

var OpenIdConnect = function () {
  function OpenIdConnect(options) {
    _classCallCheck(this, OpenIdConnect);

    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.identityProviderUrl) {
      throw new Error('Identity provider url is missing.');
    }
    if (!options.clientId) {
      throw new Error('Client id is missing.');
    }

    this.identityProviderUrl = options.identityProviderUrl;
    this.clientId = options.clientId;
    this.redirectUrl = options.redirectUrl || window.location.protocol + '//' + window.location.host;
    this.responseType = 'id_token token';
    this.scope = ('openid ' + (options.scope || '')).trim();
    this.strictMode = options.strictMode !== false;

    this.onAuthenticating = options.onAuthenticating || this.onAuthenticating;
    this.onAuthenticated = options.onAuthenticated || this.onAuthenticated;
    this.onError = options.onError || this.onError;

    // Only set the token if a hash is given, and if the hash contains a token.
    this.handleReturnFromRedirect();
  }

  _createClass(OpenIdConnect, [{
    key: 'onAuthenticating',


    /* eslint-disable class-methods-use-this */
    value: function onAuthenticating(proceed) {
      proceed();
    }
  }, {
    key: 'onAuthenticated',
    value: function onAuthenticated() {}
  }, {
    key: 'onError',
    value: function onError(err) {
      throw err;
    }
    /* eslint-enable class-methods-use-this */

  }, {
    key: 'getKey',
    value: function getKey() {
      return 'id_token_' + this.clientId;
    }
  }, {
    key: 'handleReturnFromRedirect',
    value: function handleReturnFromRedirect() {
      var nonce = window.localStorage.getItem('nonce'),
          previousUrl = window.localStorage.getItem('redirectTo');

      window.localStorage.removeItem('nonce');
      window.localStorage.removeItem('redirectTo');

      if (!window.location.hash) {
        return;
      }

      var hash = window.location.hash;
      var token = void 0;

      try {
        token = hash.match(/(#|&)id_token=([^&]+)/)[2];
      } catch (ex) {
        return;
      }

      if (this.strictMode && !nonce) {
        return this.onError(new Error('Nonce is missing.'));
      }

      var body = OpenIdConnect.decodeBodyFromToken(token);

      if (!body) {
        return this.onError(new Error('Invalid token.'));
      }
      if (this.strictMode && !body.jti) {
        return this.onError(new Error('Jti is missing.'));
      }
      if (this.strictMode && body.jti !== nonce) {
        return this.onError(new Error('Nonce and jti mismatch.'));
      }

      window.localStorage.setItem(this.getKey(), token);
      window.location.replace(previousUrl);

      this.onAuthenticated(this.getProfile());
    }
  }, {
    key: 'login',
    value: function login() {
      var _this = this;

      this.onAuthenticating(function () {
        var clientId = window.encodeURIComponent(_this.clientId),
            identityProviderUrl = _this.identityProviderUrl,
            redirectUrl = window.encodeURIComponent(_this.redirectUrl),
            responseType = window.encodeURIComponent(_this.responseType),
            scope = window.encodeURIComponent(_this.scope);

        var nonce = uuid();

        window.localStorage.setItem('nonce', nonce);
        window.localStorage.setItem('redirectTo', window.location.href);
        window.location.href = identityProviderUrl + '?client_id=' + clientId + '&redirect_uri=' + redirectUrl + '&scope=' + scope + '&response_type=' + responseType + '&nonce=' + nonce;
      });
    }
  }, {
    key: 'logout',
    value: function logout() {
      window.localStorage.removeItem(this.getKey());
    }
  }, {
    key: 'isLoggedIn',
    value: function isLoggedIn() {
      var profile = this.getProfile();

      if (!profile) {
        return false;
      }

      if (!profile.exp) {
        return false;
      }

      var expiresAt = profile.exp * 1000;
      var now = Date.now();

      if (expiresAt < now) {
        return false;
      }

      return true;
    }
  }, {
    key: 'getToken',
    value: function getToken() {
      var token = window.localStorage.getItem(this.getKey());

      if (!token) {
        return;
      }

      return token;
    }
  }, {
    key: 'getProfile',
    value: function getProfile() {
      var token = this.getToken();

      if (!token) {
        return;
      }

      return OpenIdConnect.decodeBodyFromToken(token);
    }
  }], [{
    key: 'decodeBodyFromToken',
    value: function decodeBodyFromToken(token) {
      try {
        var bodyBase64Url = token.split('.')[1];

        var bodyBase64 = bodyBase64Url.replace(/-/g, '+').replace(/_/g, '/'),
            bodyDecoded = window.atob(bodyBase64);

        return JSON.parse(bodyDecoded);
      } catch (ex) {
        return undefined;
      }
    }
  }]);

  return OpenIdConnect;
}();

module.exports = OpenIdConnect;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var events = __webpack_require__(1);

var merge = __webpack_require__(11),
    Promise = __webpack_require__(0).Promise;

var ConfigurationWatcher = __webpack_require__(12),
    getEventsApi = __webpack_require__(15),
    getReadModelApi = __webpack_require__(19),
    getWriteModelApi = __webpack_require__(26),
    ListStore = __webpack_require__(34).ListStore,
    ModelStore = __webpack_require__(36),
    NetworkConnection = __webpack_require__(39),
    wires = __webpack_require__(40);

var EventEmitter = events.EventEmitter;

var getApp = function getApp(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.host) {
    throw new Error('Host is missing.');
  }
  if (!options.port) {
    throw new Error('Port is missing.');
  }
  if (!options.protocol) {
    throw new Error('Protocol is missing.');
  }
  if (!options.authentication) {
    throw new Error('Authentication is missing.');
  }

  var host = options.host,
      port = options.port,
      protocol = options.protocol,
      authentication = options.authentication;


  return new Promise(function (resolve, reject) {
    var app = new EventEmitter();

    var networkConnection = new NetworkConnection({ host: host, port: port });
    var configurationWatcher = new ConfigurationWatcher({
      networkConnection: networkConnection,
      configuration: options.configuration
    });

    var modelStore = new ModelStore();

    var Wire = wires[protocol],
        wire = new Wire({ app: app, host: host, port: port });

    var configuration = void 0,
        hasErrored = false,
        isWireConnected = false;

    var runApplication = function runApplication() {
      if (hasErrored) {
        return;
      }

      var _configuration = configuration,
          readModel = _configuration.readModel,
          writeModel = _configuration.writeModel;


      modelStore.initialize({
        stores: {
          lists: new ListStore({ wire: wire })
        }
      }, function (err) {
        if (err) {
          return reject(err);
        }

        var eventsApi = getEventsApi({ wire: wire, writeModel: writeModel }),
            readModelApi = getReadModelApi({ wire: wire, readModel: readModel, modelStore: modelStore }),
            writeModelApi = getWriteModelApi({ app: app, wire: wire, writeModel: writeModel });

        merge(app, eventsApi, writeModelApi, readModelApi);

        resolve(app);
      });
    };

    var onAuthenticationRequired = function onAuthenticationRequired() {
      app.auth.login();
    };

    var onWireConnect = function onWireConnect() {
      isWireConnected = true;

      if (isWireConnected && configuration) {
        runApplication();
      }
    };

    var onWireError = function onWireError(err) {
      app.emit('error', err);
    };

    var onOnline = function onOnline() {
      app.emit('connected');
    };

    var onOffline = function onOffline() {
      app.emit('disconnected');
    };

    var onConfigurationFetched = function onConfigurationFetched(fetchedConfiguration) {
      configuration = fetchedConfiguration;

      if (isWireConnected && configuration) {
        runApplication();
      }
    };

    var onConfigurationError = function onConfigurationError(err) {
      hasErrored = true;

      // If there was an error fetching the configuration while starting the
      // application, and we do not have a previous one, reject connecting to
      // the application.
      if (!configuration) {
        return reject(err);
      }

      // If there is an error fetching the configuration at runtime, emit an
      // error, but the application may keep running.
      app.emit('error', err);
    };

    var onConfigurationOutdated = function onConfigurationOutdated() {
      app.emit('outdated');
    };

    app.auth = authentication;

    // Internal function, for tests only.
    app.destroy = function (optionsDestroy) {
      optionsDestroy = optionsDestroy || {};
      optionsDestroy.keepLocalStorage = optionsDestroy.keepLocalStorage || false;

      wire.removeListener('connect', onWireConnect);
      wire.removeListener('authentication-required', onAuthenticationRequired);
      wire.removeListener('error', onWireError);

      networkConnection.removeListener('online', onOnline);
      networkConnection.removeListener('offline', onOffline);
      networkConnection.destroy();

      configurationWatcher.removeListener('fetched', onConfigurationFetched);
      configurationWatcher.removeListener('error', onConfigurationError);
      configurationWatcher.removeListener('outdated', onConfigurationOutdated);
      configurationWatcher.destroy(optionsDestroy);
    };

    wire.once('connect', onWireConnect);
    wire.on('authentication-required', onAuthenticationRequired);
    wire.on('error', onWireError);
    networkConnection.on('online', onOnline);
    networkConnection.on('offline', onOffline);
    configurationWatcher.once('fetched', onConfigurationFetched);
    configurationWatcher.on('error', onConfigurationError);
    configurationWatcher.on('outdated', onConfigurationOutdated);
  });
};

module.exports = getApp;

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("lodash/merge");

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var events = __webpack_require__(1);

var Promise = __webpack_require__(0).Promise;

var localStorage = __webpack_require__(13),
    request = __webpack_require__(3);

var EventEmitter = events.EventEmitter;

var ConfigurationWatcher = function (_EventEmitter) {
  _inherits(ConfigurationWatcher, _EventEmitter);

  function ConfigurationWatcher(options) {
    _classCallCheck(this, ConfigurationWatcher);

    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.networkConnection) {
      throw new Error('Network connection is missing.');
    }

    var _this = _possibleConstructorReturn(this, (ConfigurationWatcher.__proto__ || Object.getPrototypeOf(ConfigurationWatcher)).call(this));

    _this.networkConnection = options.networkConnection;
    _this.host = options.networkConnection.host;
    _this.port = options.networkConnection.port;
    _this.hasEverBeenOffline = false;

    _this.key = 'wolkenkit_' + _this.host + ':' + _this.port + '_configuration';

    _this.wentOnline = _this.wentOnline.bind(_this);
    _this.wentOffline = _this.wentOffline.bind(_this);

    if (options.configuration) {
      var _ret;

      return _ret = process.nextTick(function () {
        return _this.emit('fetched', options.configuration);
      }), _possibleConstructorReturn(_this, _ret);
    }

    _this.wentOnline();
    return _this;
  }

  _createClass(ConfigurationWatcher, [{
    key: 'waitForNetworkChange',
    value: function waitForNetworkChange() {
      var networkConnection = this.networkConnection;


      if (networkConnection.isOnline) {
        networkConnection.once('offline', this.wentOffline);
      } else {
        networkConnection.once('online', this.wentOnline);
      }
    }
  }, {
    key: 'wentOnline',
    value: function wentOnline() {
      var _this2 = this;

      this.getConfigurationFromServer().then(function (configuration) {
        if (_this2.hasEverBeenOffline && _this2.isOutdated(configuration)) {
          _this2.setConfigurationToLocalStorage(configuration);

          return process.nextTick(function () {
            return _this2.emit('outdated', configuration);
          });
        }

        _this2.setConfigurationToLocalStorage(configuration);
        process.nextTick(function () {
          return _this2.emit('fetched', configuration);
        });
        _this2.waitForNetworkChange();
      }).catch(function () {
        _this2.wentOffline();
      });
    }
  }, {
    key: 'wentOffline',
    value: function wentOffline() {
      var _this3 = this;

      this.hasEverBeenOffline = true;

      var configuration = this.getConfigurationFromLocalStorage();

      if (!configuration) {
        this.emit('error', new Error('Failed to get configuration.'));
      }

      process.nextTick(function () {
        return _this3.emit('fetched', configuration);
      });
      this.waitForNetworkChange();
    }
  }, {
    key: 'isOutdated',
    value: function isOutdated(nextConfiguration) {
      var currentConfiguration = this.getConfigurationFromLocalStorage();

      if (!currentConfiguration) {
        return false;
      }

      return JSON.stringify(nextConfiguration) !== JSON.stringify(currentConfiguration);
    }
  }, {
    key: 'getConfigurationFromServer',
    value: function getConfigurationFromServer() {
      var host = this.host,
          port = this.port;


      return new Promise(function (resolve, reject) {
        request({
          method: 'GET',
          hostname: host,
          port: port,
          path: '/v1/configuration.json',
          withCredentials: false
        }, function (err, res) {
          if (err) {
            return reject(err);
          }
          if (res.statusCode !== 200) {
            return reject(new Error('Unexpected status code.'));
          }

          try {
            var configuration = JSON.parse(res.body);

            resolve(configuration);
          } catch (ex) {
            reject(ex);
          }
        });
      });
    }
  }, {
    key: 'getConfigurationFromLocalStorage',
    value: function getConfigurationFromLocalStorage() {
      var key = this.key;

      var value = localStorage.getItem(key);

      if (!value) {
        return undefined;
      }

      try {
        return JSON.parse(value);
      } catch (ex) {
        localStorage.removeItem(key);

        return undefined;
      }
    }
  }, {
    key: 'setConfigurationToLocalStorage',
    value: function setConfigurationToLocalStorage(configuration) {
      var key = this.key;


      localStorage.setItem(key, JSON.stringify(configuration));
    }

    // Internal function, for tests only.

  }, {
    key: 'destroy',
    value: function destroy(options) {
      options = options || {};
      options.keepLocalStorage = options.keepLocalStorage || false;

      var key = this.key,
          networkConnection = this.networkConnection;


      networkConnection.removeListener('offline', this.wentOffline);
      networkConnection.removeListener('online', this.wentOnline);

      if (options.keepLocalStorage) {
        return;
      }

      localStorage.removeItem(key);
    }
  }]);

  return ConfigurationWatcher;
}(EventEmitter);

module.exports = ConfigurationWatcher;

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var polyfill = {
  data: {},

  setItem: function setItem(key, value) {
    this.data[key] = String(value);
  },
  getItem: function getItem(key) {
    if (!this.data.hasOwnProperty(key)) {
      return undefined;
    }

    return this.data[key];
  },
  removeItem: function removeItem(key) {
    Reflect.deleteProperty(this.data, key);
  },
  clear: function clear() {
    this.data = {};
  }
};

/* eslint-disable no-undef */
var localStorage = typeof window !== 'undefined' && window.localStorage ? window.localStorage : polyfill;
/* eslint-enable no-undef */

module.exports = localStorage;

/***/ }),
/* 14 */
/***/ (function(module, exports) {

module.exports = require("https");

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var EventsAggregate = __webpack_require__(16);

var getEventsApi = function getEventsApi(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.writeModel) {
    throw new Error('Write model is missing.');
  }

  var wire = options.wire,
      writeModel = options.writeModel;


  var api = {
    events: new EventsAggregate({ wire: wire, writeModel: writeModel })
  };

  return api;
};

module.exports = getEventsApi;

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var assign = __webpack_require__(17);

var isEventIn = __webpack_require__(18);

var EventsAggregate = function EventsAggregate(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.writeModel) {
    throw new Error('Write model is missing.');
  }

  this.wire = options.wire;
  this.writeModel = options.writeModel;
};

EventsAggregate.prototype.observe = function (options) {
  var wire = this.wire,
      writeModel = this.writeModel;


  options = options || {};
  options.where = assign({}, { type: 'domain' }, options.where);

  if (!isEventIn(writeModel, options.where)) {
    throw new Error('Unknown event.');
  }

  var callbacks = {
    failed: function failed(err) {
      throw err;
    },
    started: function started() {},
    received: function received() {}
  };

  // This needs to be deferred to the next tick so that the user has a chance
  // to attach the various functions such as started, received, and failed to
  // this instance.
  process.nextTick(function () {
    var events = wire.subscribeToEvents(options.where);

    var onData = void 0,
        onEnd = void 0,
        onError = void 0,
        onStart = void 0;

    var cancel = function cancel() {
      events.cancel();
    };

    var unsubscribe = function unsubscribe() {
      events.stream.removeListener('start', onStart);
      events.stream.removeListener('data', onData);
      events.stream.removeListener('end', onEnd);
      events.stream.removeListener('error', onError);
    };

    onStart = function onStart() {
      callbacks.started(cancel);
    };

    onData = function onData(event) {
      callbacks.received(event, cancel);
    };

    onEnd = function onEnd() {
      unsubscribe();
    };

    onError = function onError(err) {
      cancel();
      unsubscribe();
      callbacks.failed(err);
    };

    events.stream.on('start', onStart);
    events.stream.on('data', onData);
    events.stream.on('end', onEnd);
    events.stream.on('error', onError);
  });

  return {
    failed: function failed(callback) {
      callbacks.failed = callback;

      return this;
    },
    started: function started(callback) {
      callbacks.started = callback;

      return this;
    },
    received: function received(callback) {
      callbacks.received = callback;

      return this;
    }
  };
};

module.exports = EventsAggregate;

/***/ }),
/* 17 */
/***/ (function(module, exports) {

module.exports = require("lodash/assign");

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


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

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var createReadModelAggregate = __webpack_require__(20);

var getReadModelApi = function getReadModelApi(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.readModel) {
    throw new Error('Read model is missing.');
  }
  if (!options.modelStore) {
    throw new Error('Model store is missing.');
  }

  var readModel = options.readModel,
      modelStore = options.modelStore,
      wire = options.wire;


  var api = {};

  Object.keys(readModel).forEach(function (modelType) {
    api[modelType] = {};

    Object.keys(readModel[modelType]).forEach(function (modelName) {
      api[modelType][modelName] = createReadModelAggregate({
        modelStore: modelStore,
        modelType: modelType,
        modelName: modelName,
        wire: wire
      });
    });
  });

  return api;
};

module.exports = getReadModelApi;

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var ListAggregate = __webpack_require__(21);

var create = function create(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.modelStore) {
    throw new Error('Model store is missing.');
  }
  if (!options.modelType) {
    throw new Error('Model type is missing.');
  }
  if (!options.modelName) {
    throw new Error('Model name is missing.');
  }

  var modelName = options.modelName,
      modelStore = options.modelStore,
      modelType = options.modelType,
      wire = options.wire;


  switch (modelType) {
    case 'lists':
      return new ListAggregate.Readable({ wire: wire, modelStore: modelStore, modelName: modelName });
    default:
      throw new Error('Invalid operation.');
  }
};

module.exports = create;

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var datasette = __webpack_require__(22);

var areDifferent = __webpack_require__(23),
    readSnapshot = __webpack_require__(24);

var Readable = function Readable(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.modelStore) {
    throw new Error('Model store is missing.');
  }
  if (!options.modelName) {
    throw new Error('Model name is missing.');
  }

  this.wire = options.wire;
  this.modelStore = options.modelStore;
  this.modelType = 'lists';
  this.modelName = options.modelName;
};

Readable.prototype.read = function (query) {
  var modelName = this.modelName,
      modelStore = this.modelStore,
      modelType = this.modelType;


  query = query || {};

  var callbacks = {
    failed: function failed(err) {
      throw err;
    },
    finished: function finished() {}
  };

  process.nextTick(function () {
    readSnapshot({ modelStore: modelStore, modelType: modelType, modelName: modelName, query: query }, function (err, result) {
      if (err) {
        return callbacks.failed(err);
      }
      callbacks.finished(result);
    });
  });

  return {
    failed: function failed(callback) {
      callbacks.failed = callback;

      return this;
    },
    finished: function finished(callback) {
      callbacks.finished = callback;

      return this;
    }
  };
};

Readable.prototype.readOne = function (query) {
  if (!query) {
    throw new Error('Query is missing.');
  }
  if (!query.where) {
    throw new Error('Where is missing.');
  }

  var modelName = this.modelName,
      modelStore = this.modelStore,
      modelType = this.modelType;


  var callbacks = {
    failed: function failed(err) {
      throw err;
    },
    finished: function finished() {}
  };

  process.nextTick(function () {
    modelStore.readOne({ modelType: modelType, modelName: modelName, query: query }, function (err, item) {
      if (err) {
        return callbacks.failed(err);
      }
      callbacks.finished(item);
    });
  });

  return {
    failed: function failed(callback) {
      callbacks.failed = callback;

      return this;
    },
    finished: function finished(callback) {
      callbacks.finished = callback;

      return this;
    }
  };
};

Readable.prototype.readAndObserve = function (query) {
  var modelName = this.modelName,
      modelStore = this.modelStore,
      modelType = this.modelType,
      wire = this.wire;


  query = query || {};

  var callbacks = {
    failed: function failed(err) {
      throw err;
    },
    started: function started() {},
    updated: function updated() {}
  };

  // This needs to be deferred to the next tick so that the user has a chance
  // to attach the various functions such as started, received, and failed to
  // this instance.
  process.nextTick(function () {
    var events = wire.subscribeToEvents({
      context: { name: modelType },
      aggregate: { name: modelName },
      type: 'readModel'
    });

    var observeStream = events.stream;

    var isDirty = datasette.create(),
        result = [];

    isDirty.set('value', false);

    var cancel = void 0,
        onObserveStreamData = void 0,
        onObserveStreamEnd = void 0,
        onObserveStreamError = void 0,
        onObserveStreamStart = void 0;

    var unsubscribeObserveStream = function unsubscribeObserveStream() {
      observeStream.removeListener('start', onObserveStreamStart);
      observeStream.removeListener('data', onObserveStreamData);
      observeStream.removeListener('end', onObserveStreamEnd);
      observeStream.removeListener('error', onObserveStreamError);
    };

    var readAndWaitForUpdates = function readAndWaitForUpdates() {
      isDirty.set('value', false);

      readSnapshot({ modelStore: modelStore, modelType: modelType, modelName: modelName, query: query }, function (err, snapshot) {
        if (err) {
          cancel();

          return callbacks.failed(err);
        }

        if (areDifferent(result, snapshot)) {
          result.length = 0;
          result.push.apply(result, _toConsumableArray(snapshot));

          callbacks.updated(result, cancel);
        }

        var onIsDirty = function onIsDirty() {
          process.nextTick(function () {
            return readAndWaitForUpdates();
          });
        };

        if (isDirty.get('value')) {
          onIsDirty();
        } else {
          isDirty.once('changed', onIsDirty);
        }
      });
    };

    cancel = function cancel() {
      isDirty.removeAllListeners();
      events.cancel();
    };

    onObserveStreamStart = function onObserveStreamStart() {
      callbacks.started(result, cancel);
      readAndWaitForUpdates();
    };

    onObserveStreamData = function onObserveStreamData() {
      isDirty.set('value', true);
    };

    onObserveStreamEnd = function onObserveStreamEnd() {
      unsubscribeObserveStream();
    };

    onObserveStreamError = function onObserveStreamError(err) {
      unsubscribeObserveStream();
      callbacks.failed(err);
    };

    observeStream.on('start', onObserveStreamStart);
    observeStream.on('data', onObserveStreamData);
    observeStream.on('end', onObserveStreamEnd);
    observeStream.on('error', onObserveStreamError);
  });

  return {
    failed: function failed(callback) {
      callbacks.failed = callback;

      return this;
    },
    started: function started(callback) {
      callbacks.started = callback;

      return this;
    },
    updated: function updated(callback) {
      callbacks.updated = callback;

      return this;
    }
  };
};

module.exports = { Readable: Readable };

/***/ }),
/* 22 */
/***/ (function(module, exports) {

module.exports = require("datasette");

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var areDifferent = function areDifferent(left, right) {
  if (!left) {
    throw new Error('Left is missing.');
  }
  if (!right) {
    throw new Error('Right is missing.');
  }

  if (left.length !== right.length) {
    return true;
  }

  for (var i = 0; i < left.length; i++) {
    if (left[i].id !== right[i].id) {
      return true;
    }

    if (JSON.stringify(left) !== JSON.stringify(right)) {
      return true;
    }
  }

  return false;
};

module.exports = areDifferent;

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var toArray = __webpack_require__(25);

var readSnapshot = function readSnapshot(options, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.modelStore) {
    throw new Error('Model store is missing.');
  }
  if (!options.modelType) {
    throw new Error('Model type is missing.');
  }
  if (!options.modelName) {
    throw new Error('Model name is missing.');
  }
  if (!options.query) {
    throw new Error('Query is missing.');
  }

  var modelName = options.modelName,
      modelStore = options.modelStore,
      modelType = options.modelType,
      query = options.query;


  modelStore.read({ modelType: modelType, modelName: modelName, query: query }, function (errRead, model) {
    if (errRead) {
      return callback(errRead);
    }
    toArray(model.stream, function (errToArray, array) {
      if (errToArray) {
        return callback(errToArray);
      }
      callback(null, array);
    });
  });
};

module.exports = readSnapshot;

/***/ }),
/* 25 */
/***/ (function(module, exports) {

module.exports = require("streamtoarray");

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var buildCommandApi = __webpack_require__(27);

var getWriteModelApi = function getWriteModelApi(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.app) {
    throw new Error('App is missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.writeModel) {
    throw new Error('Write model is missing.');
  }

  var app = options.app,
      wire = options.wire,
      writeModel = options.writeModel;


  var api = {};

  Object.keys(writeModel).forEach(function (contextName) {
    api[contextName] = {};

    Object.keys(writeModel[contextName]).forEach(function (aggregateName) {
      api[contextName][aggregateName] = function (aggregateId) {
        var commands = {};

        Object.keys(writeModel[contextName][aggregateName].commands).forEach(function (commandName) {
          commands[commandName] = buildCommandApi({ api: api, app: app, wire: wire, contextName: contextName, aggregateName: aggregateName, aggregateId: aggregateId, commandName: commandName });
        });

        return commands;
      };
    });
  });

  return api;
};

module.exports = getWriteModelApi;

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Command = __webpack_require__(28).Command,
    uuid = __webpack_require__(2);

var CommandRunner = __webpack_require__(29);

var buildCommandApi = function buildCommandApi(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.app) {
    throw new Error('App is missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.contextName) {
    throw new Error('Context name is missing.');
  }
  if (!options.aggregateName) {
    throw new Error('Aggregate name is missing.');
  }
  if (!options.commandName) {
    throw new Error('Command name is missing.');
  }

  var app = options.app,
      wire = options.wire,
      contextName = options.contextName,
      aggregateName = options.aggregateName,
      _options$aggregateId = options.aggregateId,
      aggregateId = _options$aggregateId === undefined ? uuid() : _options$aggregateId,
      commandName = options.commandName;


  return function (data, commandOptions) {
    var _ref = commandOptions || {},
        asUser = _ref.asUser;

    var command = new Command({
      context: {
        name: contextName
      },
      aggregate: {
        name: aggregateName,
        id: aggregateId
      },
      name: commandName,
      data: data,
      custom: {
        asUser: asUser
      }
    });

    return new CommandRunner({ app: app, wire: wire, command: command });
  };
};

module.exports = buildCommandApi;

/***/ }),
/* 28 */
/***/ (function(module, exports) {

module.exports = require("commands-events");

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var flatten = __webpack_require__(30),
    parseDuration = __webpack_require__(31);

var errors = __webpack_require__(32);

var defaultTimeoutDuration = parseDuration('120s'),
    disabledTimeoutDuration = parseDuration('0s');

var CommandRunner = function CommandRunner(options) {
  var _this = this;

  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.app) {
    throw new Error('App is missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }
  if (!options.command) {
    throw new Error('Command is missing.');
  }

  var app = options.app,
      wire = options.wire,
      command = options.command;


  this.app = app;
  this.command = command;
  this.aggregate = app[command.context.name][command.aggregate.name];

  this.callbacks = {
    delivered: function delivered() {},
    await: function _await() {},
    failed: function failed(err) {
      throw err;
    },
    timeout: function timeout() {}
  };

  this.cancelEvents = undefined;
  this.callbacks.timeout.duration = disabledTimeoutDuration;

  // This needs to be deferred to the next tick so that the user has a chance
  // to attach the various functions such as delivered, await, failed and timeout
  // to this instance.
  process.nextTick(function () {
    app.events.observe({
      where: {
        type: 'domain',
        metadata: { correlationId: _this.command.metadata.correlationId }
      }
    }).failed(function (err) {
      _this.clearEventsAndTimers();
      _this.fail(new errors.CommandFailed('Failed to deliver command.', err), command);
    }).started(function (cancel) {
      _this.cancelEvents = cancel;

      wire.sendCommand(command).then(function () {
        process.nextTick(function () {
          _this.callbacks.delivered(command);

          _this.callbacks.timeout.id = setTimeout(function () {
            _this.clearEventsAndTimers();
            _this.callbacks.timeout(command);
          }, _this.callbacks.timeout.duration);
        });
      }).catch(function (err) {
        _this.clearEventsAndTimers();
        _this.fail(new errors.CommandFailed('Failed to deliver command.', err), command);
      });
    }).received(function (event) {
      _this.handleEvent(event);
    });
  });
};

CommandRunner.prototype.fail = function (err, command) {
  if (!this.callbacks.failed) {
    return;
  }

  this.callbacks.failed(err, command);

  // Remove failed callback to avoid that it is being called twice for the same
  // command.
  this.callbacks.failed = undefined;
};

CommandRunner.prototype.handleEvent = function (event) {
  if (/Rejected$/.test(event.name) || /Failed$/.test(event.name)) {
    this.clearEventsAndTimers();
    this.fail(new errors.CommandRejected(event.data.reason), this.command);

    return;
  }

  if (this.callbacks.await[event.name]) {
    this.clearEventsAndTimers();
    this.callbacks.await[event.name](event, this.command);
  }
};

CommandRunner.prototype.clearEventsAndTimers = function () {
  clearTimeout(this.callbacks.timeout.id);
  if (this.cancelEvents) {
    this.cancelEvents();
  }
};

CommandRunner.prototype.delivered = function (callback) {
  this.callbacks.delivered = callback;

  return this;
};

CommandRunner.prototype.await = function (eventNames, callback) {
  var _this2 = this;

  if (this.callbacks.timeout.duration === 0) {
    this.callbacks.timeout.duration = defaultTimeoutDuration;
  }

  flatten([eventNames]).forEach(function (eventName) {
    _this2.callbacks.await[eventName] = callback;
  });

  return this;
};

CommandRunner.prototype.failed = function (callback) {
  if (this.callbacks.timeout.duration === 0) {
    this.callbacks.timeout.duration = defaultTimeoutDuration;
  }

  this.callbacks.failed = callback;

  return this;
};

CommandRunner.prototype.timeout = function (duration, callback) {
  this.callbacks.timeout = callback;
  this.callbacks.timeout.duration = parseDuration(duration);

  return this;
};

module.exports = CommandRunner;

/***/ }),
/* 30 */
/***/ (function(module, exports) {

module.exports = require("lodash/flatten");

/***/ }),
/* 31 */
/***/ (function(module, exports) {

module.exports = require("parse-duration");

/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var defekt = __webpack_require__(33);

var errors = defekt(['CommandFailed', 'CommandRejected']);

module.exports = errors;

/***/ }),
/* 33 */
/***/ (function(module, exports) {

module.exports = require("defekt");

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var ListStore = __webpack_require__(35);

module.exports = { ListStore: ListStore };

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var ListStore = function ListStore(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.wire) {
    throw new Error('Wire is missing.');
  }

  this.wire = options.wire;
};

ListStore.prototype.initialize = function (options, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  process.nextTick(function () {
    callback(null);
  });
};

ListStore.prototype.read = function (options, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.modelName) {
    throw new Error('Model name is missing.');
  }
  if (!options.query) {
    throw new Error('Query is missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  var wire = this.wire;
  var modelName = options.modelName,
      query = options.query;


  var model = wire.readModel({ modelType: 'lists', modelName: modelName, query: query });

  process.nextTick(function () {
    callback(null, model);
  });
};

module.exports = ListStore;

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var eachSeries = __webpack_require__(37),
    parallel = __webpack_require__(38);

var ModelStore = function ModelStore() {
  this.stores = {};
};

ModelStore.prototype.initialize = function (options, callback) {
  var _this = this;

  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.stores) {
    throw new Error('Stores are missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  this.stores = options.stores;

  parallel(Object.keys(this.stores).map(function (storeType) {
    return function (done) {
      return _this.stores[storeType].initialize({}, done);
    };
  }), function (err) {
    if (err) {
      return callback(err);
    }

    callback(null);
  });
};

ModelStore.prototype.processEvents = function (events, callback) {
  var _this2 = this;

  if (!events) {
    throw new Error('Events are missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  if (events.length === 0) {
    return callback(null);
  }

  var storeSpecificEvents = {};

  Object.keys(this.stores).forEach(function (storeType) {
    storeSpecificEvents[storeType] = [];
  });

  events.forEach(function (event) {
    var modelType = event.context.name;

    if (!storeSpecificEvents[modelType]) {
      return;
    }

    storeSpecificEvents[modelType].push(event);
  });

  parallel(Object.keys(this.stores).map(function (storeType) {
    return function (done) {
      return _this2.processEventsInStore(_this2.stores[storeType], storeSpecificEvents[storeType], done);
    };
  }), callback);
};

ModelStore.prototype.processEventsInStore = function (store, events, callback) {
  if (!store) {
    throw new Error('Store is missing.');
  }
  if (!events) {
    throw new Error('Events are missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  if (events.length === 0) {
    return callback(null);
  }

  eachSeries(events, function (event, done) {
    store[event.name]({
      modelName: event.aggregate.name,
      selector: event.data.selector,
      payload: event.data.payload
    }, done);
  }, callback);
};

ModelStore.prototype.read = function (options, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.modelType) {
    throw new Error('Model type is missing.');
  }
  if (!options.modelName) {
    throw new Error('Model name is missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  options.query = options.query || {};

  this.stores[options.modelType].read(options, callback);
};

ModelStore.prototype.readOne = function (options, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.modelType) {
    throw new Error('Model type is missing.');
  }
  if (!options.modelName) {
    throw new Error('Model name is missing.');
  }
  if (!options.query) {
    throw new Error('Query is missing.');
  }
  if (!options.query.where) {
    throw new Error('Where is missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  this.read({
    modelType: options.modelType,
    modelName: options.modelName,
    query: {
      where: options.query.where,
      take: 1
    }
  }, function (err, model) {
    if (err) {
      return callback(err);
    }

    var items = [];
    var onData = function onData(item) {
      items.push(item);
    };
    var onEnd = function onEnd() {
      model.stream.removeListener('data', onData);
      model.stream.removeListener('end', onEnd);

      var firstItem = items[0];

      if (!firstItem) {
        return callback(new Error('Item not found.'));
      }
      callback(null, firstItem);
    };

    model.stream.on('data', onData);
    model.stream.once('end', onEnd);
  });
};

module.exports = ModelStore;

/***/ }),
/* 37 */
/***/ (function(module, exports) {

module.exports = require("async/eachSeries");

/***/ }),
/* 38 */
/***/ (function(module, exports) {

module.exports = require("async/parallel");

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var events = __webpack_require__(1);

var request = __webpack_require__(3);

var EventEmitter = events.EventEmitter;

var NetworkConnection = function (_EventEmitter) {
  _inherits(NetworkConnection, _EventEmitter);

  function NetworkConnection(options) {
    _classCallCheck(this, NetworkConnection);

    var _this = _possibleConstructorReturn(this, (NetworkConnection.__proto__ || Object.getPrototypeOf(NetworkConnection)).call(this));

    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.host) {
      throw new Error('Host is missing.');
    }
    if (!options.port) {
      throw new Error('Port is missing.');
    }

    _this.host = options.host;
    _this.port = options.port;

    _this.isOnline = undefined;
    _this.wasOnline = undefined;
    _this.interval = 2 * 1000;
    _this.timeoutId = undefined;

    _this.test();
    return _this;
  }

  _createClass(NetworkConnection, [{
    key: 'online',
    value: function online() {
      this.wasOnline = this.isOnline;
      this.isOnline = true;

      if (this.isOnline !== this.wasOnline) {
        this.emit('online');
      }
    }
  }, {
    key: 'offline',
    value: function offline() {
      this.wasOnline = this.isOnline;
      this.isOnline = false;

      if (this.isOnline !== this.wasOnline) {
        this.emit('offline');
      }
    }
  }, {
    key: 'test',
    value: function test() {
      var _this2 = this;

      var host = this.host,
          port = this.port;


      request({
        method: 'GET',
        hostname: host,
        port: port,
        path: '/v1/ping?_=' + Date.now(),
        withCredentials: false
      }, function (err) {
        if (err) {
          _this2.offline();
        } else {
          _this2.online();
        }

        clearTimeout(_this2.timeoutId);
        _this2.timeoutId = setTimeout(function () {
          return _this2.test();
        }, _this2.interval);
      });
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      clearTimeout(this.timeoutId);
    }
  }]);

  return NetworkConnection;
}(EventEmitter);

module.exports = NetworkConnection;

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Https = __webpack_require__(41),
    Wss = __webpack_require__(43);

var wires = {
  https: Https,
  wss: Wss
};

module.exports = wires;

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var events = __webpack_require__(1),
    stream = __webpack_require__(4);

var jsonLinesClient = __webpack_require__(42),
    Promise = __webpack_require__(0).Promise;

var request = __webpack_require__(3);

var EventEmitter = events.EventEmitter,
    PassThrough = stream.PassThrough;

var Https = function (_EventEmitter) {
  _inherits(Https, _EventEmitter);

  function Https(options) {
    _classCallCheck(this, Https);

    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.app) {
      throw new Error('App is missing.');
    }
    if (!options.host) {
      throw new Error('Host is missing.');
    }
    if (!options.port) {
      throw new Error('Port is missing.');
    }

    var _this = _possibleConstructorReturn(this, (Https.__proto__ || Object.getPrototypeOf(Https)).call(this));

    _this.app = options.app;
    _this.host = options.host;
    _this.port = options.port;

    process.nextTick(function () {
      return _this.emit('connect');
    });
    return _this;
  }

  _createClass(Https, [{
    key: 'sendCommand',
    value: function sendCommand(command) {
      var _this2 = this;

      if (!command) {
        throw new Error('Command is missing.');
      }

      return new Promise(function (resolve, reject) {
        var app = _this2.app,
            host = _this2.host,
            port = _this2.port;


        var headers = {
          'content-type': 'application/json'
        };

        var token = app.auth.getToken();

        if (token) {
          headers.authorization = 'Bearer ' + token;
        }

        request({
          method: 'POST',
          hostname: host,
          port: port,
          path: '/v1/command',
          headers: headers,
          withCredentials: false
        }, JSON.stringify(command), function (err, res) {
          if (err) {
            return reject(err);
          }
          if (res.statusCode === 401) {
            _this2.emit('authentication-required');

            return reject(new Error('Authentication required.'));
          }
          if (res.statusCode !== 200) {
            return reject(new Error(res.body));
          }
          resolve();
        });
      });
    }
  }, {
    key: 'subscribeToEvents',
    value: function subscribeToEvents(filter) {
      var _this3 = this;

      filter = filter || {};

      var app = this.app,
          host = this.host,
          port = this.port;


      var headers = {},
          token = app.auth.getToken();

      if (token) {
        headers.authorization = 'Bearer ' + token;
      }

      var subscriptionStream = new PassThrough({ objectMode: true });

      var cancelSubscription = function cancelSubscription() {
        subscriptionStream.end();
      };

      // This needs to be deferred to the next tick so that the user has a chance
      // to attach to the error event of the subscriptionStream that is returned synchronously.
      process.nextTick(function () {
        jsonLinesClient({
          protocol: 'https',
          headers: headers,
          host: host,
          port: port,
          path: '/v1/events',
          body: filter
        }, function (server) {
          var onServerData = void 0,
              onServerEnd = void 0,
              onServerError = void 0,
              onSubscriptionFinish = void 0;

          var unsubscribe = function unsubscribe() {
            server.stream.removeListener('data', onServerData);
            server.stream.removeListener('end', onServerEnd);
            server.stream.removeListener('error', onServerError);
            subscriptionStream.removeListener('finish', onSubscriptionFinish);
          };

          onServerData = function onServerData(data) {
            subscriptionStream.write(data);
          };

          onServerEnd = function onServerEnd() {
            unsubscribe();
            server.disconnect();
            subscriptionStream.end();
          };

          onServerError = function onServerError(err) {
            unsubscribe();
            server.disconnect();

            if (err.statusCode === 401) {
              subscriptionStream.end();
              _this3.emit('authentication-required');

              return;
            }

            subscriptionStream.emit('error', err);
          };

          onSubscriptionFinish = function onSubscriptionFinish() {
            unsubscribe();
            server.disconnect();
            server.stream.resume();
          };

          server.stream.on('data', onServerData);
          server.stream.on('end', onServerEnd);
          server.stream.on('error', onServerError);
          subscriptionStream.on('finish', onSubscriptionFinish);

          subscriptionStream.emit('start');
        });
      });

      return { stream: subscriptionStream, cancel: cancelSubscription };
    }
  }, {
    key: 'readModel',
    value: function readModel(options) {
      var _this4 = this;

      if (!options) {
        throw new Error('Options are missing.');
      }
      if (!options.modelName) {
        throw new Error('Model name is missing.');
      }
      if (!options.modelType) {
        throw new Error('Model type is missing.');
      }

      var app = this.app,
          host = this.host,
          port = this.port;
      var modelName = options.modelName,
          modelType = options.modelType;


      options.query = options.query || {};

      var query = {};

      if (options.query.where) {
        query.where = JSON.stringify(options.query.where);
      }
      if (options.query.orderBy) {
        query.orderBy = JSON.stringify(options.query.orderBy);
      }
      if (options.query.skip) {
        query.skip = options.query.skip;
      }
      if (options.query.take) {
        query.take = options.query.take;
      }

      var headers = {},
          token = app.auth.getToken();

      if (token) {
        headers.authorization = 'Bearer ' + token;
      }

      var modelStream = new PassThrough({ objectMode: true });

      var cancelModel = function cancelModel() {
        modelStream.end();
      };

      // This needs to be deferred to the next tick so that the user has a chance
      // to attach to the error event of the modelStream that is returned synchronously.
      process.nextTick(function () {
        jsonLinesClient({
          protocol: 'https',
          headers: headers,
          host: host,
          port: port,
          path: '/v1/read/' + modelType + '/' + modelName,
          query: query
        }, function (server) {
          var onModelFinish = void 0,
              onServerData = void 0,
              onServerEnd = void 0,
              onServerError = void 0;

          var unsubscribe = function unsubscribe() {
            server.stream.removeListener('data', onServerData);
            server.stream.removeListener('end', onServerEnd);
            server.stream.removeListener('error', onServerError);
            modelStream.removeListener('finish', onModelFinish);
          };

          onServerData = function onServerData(data) {
            modelStream.write(data);
          };

          onServerEnd = function onServerEnd() {
            unsubscribe();
            server.disconnect();
            modelStream.end();
          };

          onServerError = function onServerError(err) {
            unsubscribe();
            server.disconnect();

            if (err.statusCode === 401) {
              modelStream.end();
              _this4.emit('authentication-required');

              return;
            }

            modelStream.emit('error', err);
          };

          onModelFinish = function onModelFinish() {
            unsubscribe();
            server.disconnect();
            server.stream.resume();
          };

          server.stream.on('data', onServerData);
          server.stream.on('end', onServerEnd);
          server.stream.on('error', onServerError);
          modelStream.on('finish', onModelFinish);
        });
      });

      return { stream: modelStream, cancel: cancelModel };
    }
  }]);

  return Https;
}(EventEmitter);

module.exports = Https;

/***/ }),
/* 42 */
/***/ (function(module, exports) {

module.exports = require("json-lines-client");

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var events = __webpack_require__(1),
    stream = __webpack_require__(4);

var Promise = __webpack_require__(0).Promise,
    uuid = __webpack_require__(2),
    WebSocket = __webpack_require__(44);

var EventEmitter = events.EventEmitter,
    PassThrough = stream.PassThrough;

var Wss = function (_EventEmitter) {
  _inherits(Wss, _EventEmitter);

  function Wss(options) {
    _classCallCheck(this, Wss);

    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.app) {
      throw new Error('App is missing.');
    }
    if (!options.host) {
      throw new Error('Host is missing.');
    }
    if (!options.port) {
      throw new Error('Port is missing.');
    }

    var _this = _possibleConstructorReturn(this, (Wss.__proto__ || Object.getPrototypeOf(Wss)).call(this));

    _this.app = options.app;
    _this.host = options.host;
    _this.port = options.port;

    var webSocket = new WebSocket('wss://' + _this.host + ':' + _this.port);

    webSocket.onopen = function () {
      _this.emit('connect');
    };

    _this.socket = new EventEmitter();
    _this.socket.send = function (message) {
      if (webSocket.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket is not open.');
      }

      webSocket.send(JSON.stringify(message));
    };

    webSocket.onmessage = function (event) {
      try {
        var message = JSON.parse(event.data);

        if (!message.procedureId) {
          return _this.emit('error', new Error(message.payload + ' (' + message.statusCode + ')'));
        }
        _this.socket.emit(message.procedureId, message);
      } catch (ex) {
        _this.socket.emit('error', ex);
      }
    };
    return _this;
  }

  _createClass(Wss, [{
    key: 'sendCommand',
    value: function sendCommand(command) {
      var _this2 = this;

      if (!command) {
        throw new Error('Command is missing.');
      }

      return new Promise(function (resolve, reject) {
        var app = _this2.app,
            socket = _this2.socket;


        var token = app.auth.getToken();

        var message = {
          type: 'sendCommand',
          version: 'v1',
          procedureId: uuid(),
          payload: command
        };

        if (token) {
          message.token = token;
        }

        var onMessage = function onMessage(responseMessage) {
          if (responseMessage.type === 'error') {
            if (responseMessage.statusCode === 401) {
              _this2.emit('authentication-required');

              return reject(new Error('Authentication required.'));
            }

            return reject(new Error(responseMessage.payload));
          }

          resolve();
        };

        socket.once(message.procedureId, onMessage);

        try {
          socket.send(message);
        } catch (ex) {
          socket.removeListener(message.procedureId, onMessage);
          reject(ex.message);
        }
      });
    }
  }, {
    key: 'subscribeToEvents',
    value: function subscribeToEvents(filter) {
      var _this3 = this;

      filter = filter || {};

      var app = this.app,
          socket = this.socket;

      var hasBeenCanceledByUser = false;

      var token = app.auth.getToken();

      var message = {
        type: 'subscribeEvents',
        version: 'v1',
        procedureId: uuid(),
        payload: {
          filter: filter
        }
      };

      if (token) {
        message.token = token;
      }

      var subscriptionStream = new PassThrough({ objectMode: true });

      var onSubscriptionFinish = void 0,
          onSubscriptionMessage = void 0;

      var unsubscribe = function unsubscribe() {
        subscriptionStream.removeListener('finish', onSubscriptionFinish);
        socket.removeListener(message.procedureId, onSubscriptionMessage);
        try {
          socket.send({
            type: 'unsubscribeEvents',
            version: 'v1',
            token: message.token,
            procedureId: message.procedureId
          });
        } catch (ex) {
          // If the user has already canceled the subscription they are not
          // interested in errors anymore. Otherwise, this could lead to an
          // infinite loop, as the user tries to cancel as a result of the
          // error.
          if (hasBeenCanceledByUser) {
            return;
          }
          subscriptionStream.emit('error', ex);
        }
      };

      var cancelSubscription = function cancelSubscription() {
        hasBeenCanceledByUser = true;
        unsubscribe();
        subscriptionStream.end();
      };

      onSubscriptionFinish = function onSubscriptionFinish() {
        unsubscribe();
      };

      onSubscriptionMessage = function onSubscriptionMessage(subscriptionMessage) {
        switch (subscriptionMessage.type) {
          case 'subscribedEvents':
            subscriptionStream.emit('start');
            break;
          case 'event':
            subscriptionStream.write(subscriptionMessage.payload);
            break;
          case 'error':
            unsubscribe();

            if (subscriptionMessage.statusCode === 401) {
              subscriptionStream.end();
              _this3.emit('authentication-required');

              return;
            }

            subscriptionStream.emit('error', subscriptionMessage.payload);
            break;
          default:
            throw new Error('Invalid operation.');
        }
      };

      subscriptionStream.on('finish', onSubscriptionFinish);
      socket.on(message.procedureId, onSubscriptionMessage);

      // This needs to be deferred to the next tick so that the user has a chance
      // to attach to the error event of the subscriptionStream that is returned synchronously.
      process.nextTick(function () {
        try {
          socket.send(message);
        } catch (ex) {
          subscriptionStream.emit('error', ex);
        }
      });

      return { stream: subscriptionStream, cancel: cancelSubscription };
    }
  }, {
    key: 'readModel',
    value: function readModel(options) {
      var _this4 = this;

      if (!options) {
        throw new Error('Options are missing.');
      }
      if (!options.modelName) {
        throw new Error('Model name is missing.');
      }
      if (!options.modelType) {
        throw new Error('Model type is missing.');
      }

      var app = this.app,
          socket = this.socket;
      var modelName = options.modelName,
          modelType = options.modelType;

      var hasBeenCanceledByUser = false;

      options.query = options.query || {};

      var query = {};

      if (options.query.where) {
        query.where = options.query.where;
      }
      if (options.query.orderBy) {
        query.orderBy = options.query.orderBy;
      }
      if (options.query.skip) {
        query.skip = options.query.skip;
      }
      if (options.query.take) {
        query.take = options.query.take;
      }

      var token = app.auth.getToken();

      var message = {
        type: 'subscribeRead',
        version: 'v1',
        procedureId: uuid(),
        payload: {
          modelType: modelType,
          modelName: modelName,
          query: query
        }
      };

      if (token) {
        message.token = token;
      }

      var modelStream = new PassThrough({ objectMode: true });

      var onModelFinish = void 0,
          onModelMessage = void 0;

      var unsubscribe = function unsubscribe() {
        modelStream.removeListener('finish', onModelFinish);
        socket.removeListener(message.procedureId, onModelMessage);

        try {
          socket.send({
            type: 'unsubscribeRead',
            version: 'v1',
            token: message.token,
            procedureId: message.procedureId
          });
        } catch (ex) {
          // If the user has already canceled the subscription they are not
          // interested in errors anymore. Otherwise, this could lead to an
          // infinite loop, as the user tries to cancel as a result of the
          // error.
          if (hasBeenCanceledByUser) {
            return;
          }
          modelStream.emit('error', ex);
        }
      };

      var cancelModel = function cancelModel() {
        hasBeenCanceledByUser = true;
        unsubscribe();
        modelStream.end();
      };

      onModelFinish = function onModelFinish() {
        unsubscribe();
      };

      onModelMessage = function onModelMessage(modelMessage) {
        switch (modelMessage.type) {
          case 'subscribedRead':
            modelStream.emit('start');
            break;
          case 'item':
            modelStream.write(modelMessage.payload);
            break;
          case 'finish':
            modelStream.end();
            unsubscribe();
            break;
          case 'error':
            unsubscribe();

            if (modelMessage.statusCode === 401) {
              modelStream.end();
              _this4.emit('authentication-required');

              return;
            }

            modelStream.emit('error', modelMessage.payload);
            break;
          default:
            throw new Error('Invalid operation.');
        }
      };

      modelStream.on('finish', onModelFinish);
      socket.on(message.procedureId, onModelMessage);

      // This needs to be deferred to the next tick so that the user has a chance
      // to attach to the error event of the modelStream that is returned synchronously.
      process.nextTick(function () {
        try {
          socket.send(message);
        } catch (ex) {
          modelStream.emit('error', ex);
        }
      });

      return { stream: modelStream, cancel: cancelModel };
    }
  }]);

  return Wss;
}(EventEmitter);

module.exports = Wss;

/***/ }),
/* 44 */
/***/ (function(module, exports) {

module.exports = require("ws");

/***/ })
/******/ ]);