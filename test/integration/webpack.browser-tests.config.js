'use strict';

const path = require('path');

const processenv = require('processenv'),
      webpack = require('webpack');

module.exports = {
  bail: true,
  devtool: 'inline-source-map',
  entry: path.join(__dirname, 'wolkenkitClientWssTests.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'tests.js'
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [ 'env' ]
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.REMOTE_URL': JSON.stringify(processenv('REMOTE_URL')),
      'process.env.TEST_ENV': JSON.stringify('browser')
    })
  ]
};
