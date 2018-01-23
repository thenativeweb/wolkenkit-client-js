'use strict';

const path = require('path');

const merge = require('lodash/merge'),
      nodeExternals = require('webpack-node-externals'),
      processenv = require('processenv'),
      webpack = require('webpack');

const tests = {
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

const e2eDist = {
  bail: true,
  entry: path.join(__dirname, 'lib', 'wolkenkitClient.js'),
  output: {
    path: path.resolve(__dirname, 'test', 'e2e', 'dist'),
    filename: 'wolkenkit-client.browser.js',
    library: 'wolkenkit',
    libraryTarget: 'umd'
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
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('production') })
  ]
};

module.exports = [ tests, e2eDist ];
