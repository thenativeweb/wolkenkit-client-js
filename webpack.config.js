'use strict';

const path = require('path');

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer'),
      processenv = require('processenv');

const configuration = {
  entry: path.join(__dirname, 'dist', 'wolkenkitClient.js'),
  mode: 'production',
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'bundle'),
    filename: 'wolkenkitClient.js',
    libraryTarget: 'umd'
  },
  plugins: []
};

if (processenv('ANALYZE_BUNDLE')) {
  configuration.plugins.push(new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    openAnalyzer: false
  }));
}

module.exports = configuration;
