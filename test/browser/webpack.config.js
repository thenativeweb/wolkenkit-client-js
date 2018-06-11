'use strict';

const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const configurationAuthentication = {
  entry: path.join(__dirname, 'authentication', 'openIdConnectClient', 'index.js'),
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

module.exports = [ configurationAuthentication ];
