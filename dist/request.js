'use strict';

var https = require('https');

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