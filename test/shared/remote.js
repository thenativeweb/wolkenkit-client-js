'use strict';

const http = require('http');

const bodyParser = require('body-parser'),
      cors = require('cors'),
      express = require('express'),
      shell = require('shelljs');

const env = require('./env'),
      issueToken = require('./issueToken'),
      resetMongoDb = require('./resetMongoDb'),
      waitFor = require('./waitFor');

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.post('/stop-broker', (req, res) => {
  const result = shell.exec(`docker stop test-broker`);

  if (result.code > 0) {
    return res.status(500).json({ error: result.stderr });
  }

  res.status(200).end();
});

app.post('/start-broker', (req, res) => {
  const result = shell.exec(`docker start test-broker`);

  if (result.code > 0) {
    return res.status(500).json({ error: result.stderr });
  }

  waitFor('https://local.wolkenkit.io:9000', err => {
    if (err) {
      return res.status(500).json({ error: err });
    }

    res.status(200).end();
  });
});

app.post('/reset-mongo-db', (req, res) => {
  resetMongoDb({ url: env.MONGO_URL_INTEGRATION }, err => {
    if (err) {
      return res.status(500).json({ error: err });
    }

    res.status(200).end();
  });
});

app.post('/issue-token', (req, res) => {
  if (!req.body.subject) {
    return res.status(500).json({ error: 'Subject is missing.' });
  }

  const token = issueToken(req.body.subject, req.body.payload);

  res.status(200).json({ token });
});

http.createServer(app).listen(env.REMOTE_PORT, () => {
  /* eslint-disable no-console */
  console.log(`Remote started on port ${env.REMOTE_PORT}`);
  /* eslint-enable no-console */
});
