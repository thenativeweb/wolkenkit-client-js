'use strict';

const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin'),
      processenv = require('processenv'),
      webpack = require('webpack');

const configurationAuthentication = {
  entry: path.join(__dirname, 'authentication', 'openIdConnectClient', 'index.js'),
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'build', 'authentication'),
    filename: 'openIdConnectClient.js'
  },
  resolve: {
    alias: { 'wolkenkit-client': path.join(__dirname, 'dist', 'wolkenkitClient.js') }
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
    filename: 'integrationTests.js'
  },
  resolve: {
    alias: { '../../wolkenkit-client': path.join(__dirname, 'dist', 'wolkenkitClient.js') }
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
