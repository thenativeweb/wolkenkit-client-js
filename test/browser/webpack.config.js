'use strict';

const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin'),
      processenv = require('processenv'),
      webpack = require('webpack');

const pathToWolkenkitBundle = path.join(__dirname, '..', '..', 'bundle', 'wolkenkitClient.js');

const configurationAuthentication = {
  entry: path.join(__dirname, 'authentication', 'openIdConnectClient', 'index.js'),
  mode: 'development',
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'build', 'authentication'),
    filename: 'openIdConnectClient.js'
  },
  resolve: {
    alias: { 'wolkenkit-client': pathToWolkenkitBundle }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [{ loader: 'babel-loader', options: { babelrc: false, presets: [ 'env' ]}}]
      }
    ]
  },
  plugins: [ new HtmlWebpackPlugin() ]
};

const configurationIntegration = {
  entry: path.join(__dirname, '..', 'integration', 'wolkenkitClientWssTests.js'),
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'build', 'integration'),
    filename: 'integration.js'
  },
  resolve: {
    alias: { '../../src/wolkenkitClient': pathToWolkenkitBundle }
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
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'integration', 'index.html'),
      inject: 'head'
    })
  ]
};

module.exports = [ configurationAuthentication, configurationIntegration ];
