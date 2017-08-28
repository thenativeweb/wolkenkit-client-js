'use strict';

const roboter = require('roboter');

roboter.
  workOn('server').
  equipWith(task => {
    task('universal/analyze', {
      src: [ '**/*.js', '!node_modules/**/*.js', '!coverage/**/*.js', '!dist/**/*.js', '!test/integration/dist/**/*.js' ]
    });

    task('universal/shell', {
      build: './node_modules/.bin/webpack --config webpack.config.js',
      'test-e2e': './node_modules/.bin/wdio test/e2e/wdio.config.js'
    });

    task('universal/unused-dependencies', {
      exclude: [ 'dist' ]
    });

    task('universal/license', {
      compatible: [
        // Individual licenses
        'Apache-2.0', 'Apache-2.0*',
        'BSD-2-Clause', 'BSD-3-Clause',
        'ISC',
        'MIT', 'MIT*', 'MIT/X11',
        'MIT Licensed. http://www.opensource.org/licenses/mit-license.php',
        'LGPL-2.1+',
        'Public Domain',
        'Unlicense',

        // Combined licenses
        '(Apache-2.0 OR MPL-1.1)',
        'BSD-3-Clause OR MIT',
        '(MIT AND CC-BY-3.0)',
        '(MIT OR Apache-2.0)',
        '(WTFPL OR MIT)'
      ],

      ignore: {
        // MIT, see https://github.com/cthackers/adm-zip/blob/d8ed9063262309b700d0cfa1979d948aa3ac515c/MIT-LICENSE.txt
        'adm-zip': '0.4.7',

        // AGPL 3.0
        // Basically, this is not compatible to LGPL 3.0, but since this is our
        // code anyway, we are free to use it.
        'commands-events': '1.0.0',

        // BSD-3-Clause, see https://github.com/deoxxa/duplexer2/blob/0.0.2/LICENSE.md
        duplexer2: '0.0.2',

        // BSD-3-Clause, see https://github.com/estools/esquery/blob/v1.0.0/license.txt
        esquery: '1.0.0',

        // MIT, see https://github.com/mklabs/node-fileset/blob/v0.2.1/LICENSE-MIT
        fileset: '0.2.1',

        // MIT, see https://github.com/tarruda/has/blob/1.0.1/LICENSE-MIT
        has: '1.0.1',

        // BSD-3-Clause OR AFL-2.1, see https://github.com/kriszyp/json-schema/blob/v0.2.3/README.md
        'json-schema': '0.2.3',

        // BSD-2-Clause, see https://github.com/facebook/regenerator/blob/30d34536b9e3f7a2873b04a16ec66fec9c8246f6/LICENSE
        'regenerator-transform': '0.10.1',

        // BSD-2-Clause, see https://github.com/jviereck/regjsparser/blob/0.1.5/LICENSE.BSD
        regjsparser: '0.1.5',

        // MIT, see https://github.com/eugeneware/unique-stream/blob/v1.0.0/LICENSE
        'unique-stream': '1.0.0',

        // AGPL 3.0
        // Basically, this is not compatible to LGPL 3.0, but since this is our
        // code anyway, we are free to use it.
        'wolkenkit-command-tools': '1.0.0',

        // AGPL 3.0
        // Basically, this is not compatible to LGPL 3.0, but since this is our
        // code anyway, we are free to use it.
        'wolkenkit-test': '1.1.1'
      }
    });
  }).
  start();
