'use strict';

const async = require('async'),
      MongoClient = require('mongodb').MongoClient;

const resetMongoDb = function (options, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.url) {
    throw new Error('Url is missing.');
  }

  /* eslint-disable id-length */
  MongoClient.connect(options.url, { w: 1 }, (errConnect, db) => {
    if (errConnect) {
      return callback(errConnect);
    }

    /* eslint-enable id-length */
    db.collections((errCollections, collections) => {
      if (errCollections) {
        return callback(errCollections);
      }

      async.each(collections, (collection, done) => {
        if (collection.collectionName.startsWith('system')) {
          return done(null);
        }
        collection.drop(done);
      }, err => {
        if (err) {
          return callback(err);
        }

        db.close(errClose => {
          if (errClose) {
            return callback(errClose);
          }

          callback(null);
        });
      });
    });
  });
};

module.exports = resetMongoDb;
