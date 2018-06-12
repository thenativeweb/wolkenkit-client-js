# wolkenkit-client

wolkenkit-client is a client to access wolkenkit applications.

![wolkenkit-client](images/logo.jpg "wolkenkit-client")

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

```shell
$ npx roboter
```

Running the tests on multiple browsers and platforms is supported by [BrowserStack](https://www.browserstack.com/), which offers this service for free to open-source projects.

[![logo-browserstack](images/logo-browserstack.png "logo-browserstack")](https://www.browserstack.com/)

## Creating the minified version

To create the minified version of the client-side module, run the following command.

```shell
$ npx roboter build
```

## Running the integration tests in your local browser

While developing the client you want to get feedback as quick as possible if the client still runs in current browsers. Therefore you can run the following command.

```shell
$ node test/integration/runTestServerForBrowser.js
```

This will start a wolkenkit test application, build and watch the tests for the client and serve them statically. Point your browser to http://localhost:3000. This will run the client integration tests inside your browser.

### Running the tests from a virtual machine

To run the integration tests from a browser within a virtual machine, e.g. to run them using Internet Explorer 11, first you need to setup your virtual machine's `/etc/hosts` file such that `local.wolkenkit.io` resolves to the IP address of your host system.

```shell
192.168.99.100  local.wolkenkit.io
```

Please note that if you are using Windows this configuration is at `C:\Windows\system32\drivers\etc\hosts`.

Then, point your browser to `http://local.wolkenkit.io:3000/` to actually run the tests.

## License

Copyright (c) 2014-2018 the native web.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along with this program. If not, see [GNU Licenses](http://www.gnu.org/licenses/).
