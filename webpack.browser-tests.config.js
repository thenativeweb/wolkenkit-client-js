'use strict';

const path = require('path');

const processenv = require('processenv'),
      webpack = require('webpack');

const configuration = {
  bail: true,
  devtool: 'inline-source-map',
  entry: path.join(__dirname, 'test', 'integration', 'wolkenkitClientWssTests.js'),
  output: {
    path: path.resolve(__dirname, 'test', 'integration', 'dist'),
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
              presets: [ 'es2015' ]
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

module.exports = configuration;
