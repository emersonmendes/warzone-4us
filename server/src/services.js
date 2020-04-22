'use strict';

const logger = require('./logger');

const codBaseURL = "https://my.callofduty.com/api/papi-client";
const profileURL = "https://profile.callofduty.com";

const axios = require('axios').create({ baseURL: codBaseURL });
const request = require('request');
const cookie = require('cookie');

let tokensCookie = '';

async function getLoginToken(){
    const response = await axios.get(`${profileURL}/cod/login`);
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

    const user = process.env.COD_USER;
    const pass = process.env.COD_PASS;

    if(!user || !pass){
        throw new Error("Argumenos de login não foram passados!");
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

async function getStats(data, cbSuccess, cbError){

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

            const response = await axios.get(url, { headers: { 'Cookie': tokensCookie } });

            if(response.data.status === 'error' && response.data.data.message.includes('not authenticated')){
                tokensCookie = "";
                break;
            }

            if(response.data.status === 'error' && response.data.data.message.includes('limit exceeded')){
                result.push({
                    username: d.player,
                    error: `Aguarde um momento. Houve muitas requisições simultaneas.`
                });
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
    getStats: getStats
}