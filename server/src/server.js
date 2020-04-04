'use strict';

const CLIENT_PATH = '../../client';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const logger = require('./logger');
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const routes = require('./routes');

app.use(cors());
app.use(express.static(path.join(__dirname, `${CLIENT_PATH}/dist`)));
app.use(bodyParser.json({limit: '20mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

const port = 9191;

logger.info('App listening on port ' + port);

app.use('/api', routes);

app.get('/',(req, res) => {
    res.sendFile(path.join(__dirname, `${CLIENT_PATH}//public/index.html`));
});

app.listen(port);

if(process.env.NODE_ENV === 'test'){
    module.exports = app;
}