'use strict';

const path = require('path');

const merge = require('lodash/merge'),
      nodeExternals = require('webpack-node-externals'),
      webpack = require('webpack');

const configurationBase = {
  bail: true,
  entry: path.join(__dirname, 'src', 'wolkenkitClient.js'),
  output: {
    path: path.resolve(__dirname, 'dist')
  },
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
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('production') })
  ]
};

const configurationBrowser = merge({}, configurationBase, {
  output: {
    filename: 'wolkenkit-client.browser.js',
    library: 'wolkenkit',
    libraryTarget: 'umd'
  },
  target: 'web'
});

const configurationBrowserMin = merge({}, configurationBase, {
  output: {
    filename: 'wolkenkit-client.browser.min.js',
    library: 'wolkenkit',
    libraryTarget: 'umd'
  },
  target: 'web',
  plugins: [
    new webpack.optimize.UglifyJsPlugin()
  ]
});

const configurationNode = merge({}, configurationBase, {
  output: {
    filename: 'wolkenkit-client.node.js',
    libraryTarget: 'commonjs2'
  },
  target: 'node',
  externals: [ nodeExternals() ]
});

module.exports = [ configurationBrowser, configurationBrowserMin, configurationNode ];
