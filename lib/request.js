'use strict';

const https = require('https');

const request = function (options, reqData, callback) {
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

  let hasErrored = false,
      onReqError,
      unsubscribeReq,
      unsubscribeRes;

  const req = https.request(options, res => {
    let body = '',
        onResData,
        onResEnd,
        onResError;

    unsubscribeRes = function () {
      res.removeListener('data', onResData);
      res.removeListener('end', onResEnd);
      res.removeListener('error', onResError);
    };

    onResData = function (data) {
      body += data;
    };

    onResEnd = function () {
      unsubscribeReq();
      unsubscribeRes();
      callback(null, { statusCode: res.statusCode, body });
    };

    onResError = function (err) {
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

  unsubscribeReq = function () {
    req.removeListener('error', onReqError);
  };

  onReqError = function (err) {
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
