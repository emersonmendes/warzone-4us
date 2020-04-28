'use strict';

const logger = require('./logger');
const request = require('request');
const cookie = require('cookie');
const axios = require('axios');
const rateLimit = require('axios-rate-limit');

const codBaseURL = "https://my.callofduty.com/api/papi-client";
const profileURL = "https://profile.callofduty.com";
const limitExceededPenaltyTimeout = 30000;
let limitExceededPenalty = false;
const blockedCredentials = [];
const cookies = {};

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

function getCredential(){

    if(!process.env.COD_CREDENTIALS){
        throw new Error("Variáveis de ambiente 'COD_CREDENTIALS' de login não foram setadas!");
    }

    const credentials = JSON.parse(process.env.COD_CREDENTIALS);

    let credential = credentials[Math.floor(Math.random() * credentials.length)];

    if(blockedCredentials.includes(credential.user)){
        logger.warn(`O usuário ${credential.user} está na lista de bloqueados, tentendo outro usuário.`);
        return getCredential();
    }

    if(blockedCredentials.length === credentials.length){
        logger.warn(`Todos os usuários estão na lista de bloqueados limpando a lista.`);
        blockedCredentials = [];
        return getCredential();
    }

    return credential;

}

async function doLogin(){

    const credential = getCredential();

    if(cookies[credential.user]){
        logger.info(`Utilizando cookie do user: ${credential.user}.`);
        return {
            cookie: cookies[credential.user],
            user: credential.user
        }
    }

    logger.info(`Efetuando login api cod login user: ${credential.user}.`);

    const token = await getLoginToken();

    const options = {
        url: `${profileURL}/do_login`,
        method: 'POST',
        form: {
            'username': credential.user,
            'password': credential.pass,
            'remember_me': 'true',
            '_csrf': token
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': `new_SiteId=cod; check=true; XSRF-TOKEN=${token}; `
        }
    };

    const response = await doPostRequest(options);
    const setCookie = response.headers['set-cookie'];
    const ssoCookie = cookie.parse(setCookie.filter(x => x.includes("ACT_SSO_COOKIE"))[0])['ACT_SSO_COOKIE'];

    const result = {
        cookie: `ACT_SSO_COOKIE=${ssoCookie}; `,
        user: credential.user
    };

    cookies[credential.user] = result.cookie;

    return result;

}

function parseMatchesData(data){

    const matches = [];

    for(const item of data){

        const rankedTeams = item.rankedTeams;

        let ourTeam;
        let champTeam;

        ourTeam = rankedTeams.filter(r => r.players.map( p => p.team).includes(item.player.team));
        champTeam = rankedTeams.filter(r => r.placement === 1.0);

        const ourTeamResult = (ourTeam && ourTeam.length) ? ourTeam[0].players.map(item => `${item.platform}> ${item.username} (${item.playerStats.kills})`) : ['?'];
        const champTeamResult = (champTeam && champTeam.length) ? champTeam[0].players.map(item => `${item.platform}> ${item.username} (${item.playerStats.kills})`) : ['?'];

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
            teamPlacement: (ourTeam && ourTeam.length) ? ourTeam[0].placement : '?',
            ourTeam: ourTeamResult,
            champTeam: champTeamResult
        });

    }

    return matches;

}

async function getLastMatches(platform, player, cbSuccess, cbError){

    logger.info('chamando getLastMatches.');

    const url = `/crm/cod/v2/title/mw/platform/${platform}/gamer/${player}/matches/wz/start/0/end/0/details`;

    try {

        const result = await doLogin();

        const response = await http.get(url, { headers: { 'Cookie': result.cookie } });

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
        let user;

        if(!data || data.length === 0){
            cbSuccess([]);
        }

        const loginResult = await doLogin();
        user = loginResult.user;

        for(const d of data){

            const url = `/stats/cod/v1/title/mw/platform/${d.platform}/gamer/${d.player.replace("#","%")}/profile/type/wz`;

            logger.info(`Efetuando requisição getstats. for player: ${d.player}`);
            const response = await http.get(url, { headers: { 'Cookie': loginResult.cookie } });

            if(response.data.status === 'error' && response.data.data.message.includes('not authenticated')){
                break;
            }

            if(response.data.status === 'error' && response.data.data.message.includes('limit exceeded')){
                result.push({ error: limitExceededMsg });
                logger.warn(`Foi penalizado em ${limitExceededPenaltyTimeout / 1000} segundos por limite excedido de requisição na api do cod.`);
                limitExceededPenalty = true;
                blockedCredentials.push(user);
                logger.warn(`O usuário ${user} está na lista de bloqueados por 'limit exceeded'`);
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