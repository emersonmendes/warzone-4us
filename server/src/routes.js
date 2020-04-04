'use strict';

const logger = require('./logger');
const express = require('express');
const routes = express.Router();
const accessusService = require('./services');


routes.route('/helloworld').get((req, res) => {
    res.status(200).send('Hellow World');
});

module.exports = routes;