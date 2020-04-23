'use strict';

const logger = require('./logger');
const request = require('request');
const cookie = require('cookie');
const axios = require('axios');
const rateLimit = require('axios-rate-limit');

const codBaseURL = "https://my.callofduty.com/api/papi-client";
const profileURL = "https://profile.callofduty.com";
const limitExceededPenaltyTimeout = 120000;
let tokensCookie = '';
let limitExceededPenalty = false;

const http = rateLimit(axios.create({ baseURL: codBaseURL }), { maxRequests: 4, perMilliseconds: 2000 });

async function getLoginToken(){
    const response = await http.get(`${profileURL}/cod/login`);
    return cookie.parse(response.headers["set-cookie"][0])['XSRF-TOKEN'];
}

function doPostRequest(options){
    return new Promise(function(resolve, reject){
        request(options, (error, response) => {
            if(error){
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
}

async function doLogin(){

    logger.info('Efetuando login api cod.');

    const user = process.env.COD_USER;
    const pass = process.env.COD_PASS;

    if(!user || !pass){
        throw new Error("Variáveis de ambiente 'COD_USER' e 'COD_PASS' de login não foram setadas!");
    }

    const token = await getLoginToken();

    const options = {
        url: `${profileURL}/do_login`,
        method: 'POST',
        form: {
            'username': user,
            'password': pass,
            'remember_me': 'true',
            '_csrf': token
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': `new_SiteId=cod; check=true; XSRF-TOKEN=${token}; `
        }
    };

    const response = await doPostRequest(options);
    const cookies = response.headers['set-cookie'];
    const ssoCookie = cookie.parse(cookies.filter(x => x.includes("ACT_SSO_COOKIE"))[0])['ACT_SSO_COOKIE'];

    return `ACT_SSO_COOKIE=${ssoCookie}; `

}

function parseMatchesData(data){

    const matches = [];

    for(const item of data){

        const rankedTeams = item.rankedTeams;

        const ourTeam = rankedTeams.filter( r => r.placement === item.playerStats.teamPlacement)[0].players.map( item => `<${item.platform}> ${item.username} (${item.playerStats.kills})`);
        const champTeam = rankedTeams.filter( r => r.placement === 1.0)[0].players.map( item => `<${item.platform}> ${item.username} (${item.playerStats.kills})`);

        const playerStats = item.playerStats;

        matches.push({
            matchID: item.matchID,
            playerCount: item.playerCount,
            kills: playerStats.kills,
            headshots: playerStats.headshots,
            deaths: playerStats.deaths,
            gulagDeaths: playerStats.gulagDeaths,
            damageDone: playerStats.damageDone,
            damageTaken: playerStats.damageTaken,
            teamPlacement: playerStats.teamPlacement,
            ourTeam: ourTeam,
            champTeam: champTeam
        });

    }

    return matches;

}

async function getLastMatches(platform, player, cbSuccess, cbError){

    const url = `/crm/cod/v2/title/mw/platform/${platform}/gamer/${player}/matches/wz/start/0/end/0/details`;

    try {

        if(!tokensCookie){
            tokensCookie = await doLogin();
        }

        const response = await http.get(url, { headers: { 'Cookie': tokensCookie } });

        if('success' === response.data.status){

            cbSuccess(parseMatchesData(response.data.data.matches));
        } else {
            cbSuccess([]);
        }

    } catch(err){
        logger.error(err);
        cbError();
    }

}

async function getStats(data, cbSuccess, cbError){

    const limitExceededMsg = 'Aguarde um momento. Houve muitas requisições simultâneas.';

    if(limitExceededPenalty){
        logger.warn(`Está na penalização por limite excedido de requisição na api do cod.`);
        cbSuccess([{ error: limitExceededMsg }]);
        return;
    }

    try {

        let result = [];

        if(!data || data.length === 0){
            cbSuccess([]);
        }

        if(!tokensCookie){
            tokensCookie = await doLogin();
        }

        for(const d of data){

            const url = `/stats/cod/v1/title/mw/platform/${d.platform}/gamer/${d.player.replace("#","%")}/profile/type/wz`;

            logger.info(`Efetuando requisição getstats. for player: ${d.player}`);
            const response = await http.get(url, { headers: { 'Cookie': tokensCookie } });

            if(response.data.status === 'error' && response.data.data.message.includes('not authenticated')){
                tokensCookie = "";
                break;
            }

            if(response.data.status === 'error' && response.data.data.message.includes('limit exceeded')){
                result.push({ error: limitExceededMsg });
                limitExceededPenalty = true;
                logger.warn(`Foi penalizado em ${limitExceededPenaltyTimeout / 1000} segundos por limite excedido de requisição na api do cod.`);
                setTimeout(() => limitExceededPenalty = false, limitExceededPenaltyTimeout);
                break;
            }

            if(response.data.status === 'success' && response.data.data.lifetime.mode.br_all){
                const data = response.data.data;
                const properties = data.lifetime.mode.br.properties;
                result.push({
                    username: data.username,
                    wins: properties.wins,
                    level: data.level,
                    kills: properties.kills,
                    deaths: properties.deaths,
                    balance: properties.kills - properties.deaths,
                    gamesPlayed: properties.gamesPlayed,
                    kdRatio: properties.kdRatio,
                    platform: data.platform
                });
            } else {
                result.push({
                    username: d.player,
                    error: `Usuário ${d.player} não encontrado para a plataforma ${d.platform}.`
                });
            }

        }

        cbSuccess(result);

    } catch(err){
        logger.error(err);
        cbError();
    }

}

module.exports = {
    getStats: getStats,
    getLastMatches: getLastMatches
}