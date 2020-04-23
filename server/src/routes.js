'use strict';

const logger = require('./logger');
const express = require('express');
const routes = express.Router();
const services = require('./services');

const PLATFORM = {
    battle: "battle",
    steam: "steam",
    psn: "psn",
    xbl: "xbl",
    acti: "uno"
};

routes.route('/stats').post((req, res) => {
    services.getStats(req.body.players, (result) => {
        res.status(200).json(result);
    }, () => {
        res.status(400).json({ msg : "deu erro!"});
    });
});

routes.route('/matches').get((req, res) => {
    services.getLastMatches(req.query.platform, req.query.username, (result) => {
        res.status(200).json(result);
    }, () => {
        res.status(400).json({ msg : "deu erro!"});
    });
});

module.exports = routes;