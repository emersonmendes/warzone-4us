'use strict';

const logger = require('./logger');
const request = require('request');
const cookie = require('cookie');
const axios = require('axios');
const querystring = require('querystring');
const rateLimit = require('axios-rate-limit');

const codBaseURL = "https://api.tracker.gg/api/v2";

const http = axios.create({ baseURL: codBaseURL });

function parseMatchesData(data){
    const matches = [];
    for(const item of data){
        if(!item.attributes.modeId.includes('plnbld') && !item.attributes.modeId.includes('br_kingslayer_kingsltrios') && !item.attributes.modeId.includes('rebirth')){ // REMOVENDO SAQUE e Rebirth
            matches.push({
                username: item.segments[0].metadata.platformUserHandle,
                team: [],
                teamPlacement: item.segments[0].stats.teamPlacement.value,
                kills: item.segments[0].stats.kills.value,
                deaths: item.segments[0].stats.deaths.value,
                mode: item.metadata.modeName,
                duration: item.metadata.duration.value,
                // matchID: item.matchID,
                playerCount: item.metadata.playerCount,
                teamCount: item.metadata.teamCount,
                timestamp: item.metadata.timestamp
            });
        }
    }
    return matches;
}

async function getLastMatches(platform, player, cbSuccess, cbError){

    const url = `/warzone/standard/matches/${platform}/${querystring.escape(player)}?type=wz`;

    try {

        const response = await http.get(url, { headers: { 'Cookie': "authority=api.tracker.gg; origin=https://cod.tracker.gg; referer=https://cod.tracker.gg/;" } });

        if(200 === response.status){
            cbSuccess(parseMatchesData(response.data.data.matches));
        } else {
            cbSuccess([]);
        }

    } catch(err){
        logger.error(err);
        cbError();
    }

}

async function getStatsRequest(reqData, result){

    const url = `/warzone/standard/profile/${reqData.platform}/${reqData.player}`;

    const response = await http.get(url, { headers: { 'Cookie': "authority=api.tracker.gg; origin=https://cod.tracker.gg; referer=https://cod.tracker.gg/;" } });

    if(response.status === 200){

        const data = response.data.data;

        const segments = data.segments[1];

        result.push({
            username: data.platformInfo.platformUserIdentifier,
            platform: data.platformInfo.platformSlug,
            level: 0,
            wins: segments.stats.wins.value,
            kills: segments.stats.kills.value,
            deaths: segments.stats.deaths.value,
            balance: (segments.stats.kills.value - segments.stats.deaths.value),
            gamesPlayed: segments.stats.gamesPlayed.value,
            kdRatio: segments.stats.kdRatio.value,
            timePlayed: segments.stats.timePlayed.value,
            topFive: segments.stats.top5.value,
            topTen: segments.stats.top10.value
        });

    } else {
        result.push({
            username: reqData.player,
            error: `Usuário '${reqData.player}' não encontrado para a plataforma '${reqData.platform}'.`
        });
    }

}

async function getMatchDetails(data, cbSuccess, cbError){

    const url = `/crm/cod/v2/title/mw/platform/psn/fullMatch/wz/${data.matchID}/en`;

    try {

        const response = await http.get(url);

        const result = {
            ourTeam: {
                players: []
            },
            teams : {},
            mostKills: {
                count: 0
            },
            mostDeaths: {
                count: 0
            }
        };

        for (const item of response.data.data.allPlayers){

            const teamPlacement = Number(item.playerStats.teamPlacement);
            const teamName = item.player.team;
            const clanTag = item.player.clantag ? item.player.clantag.replace('^3','[').replace('^7',']') : '';
            const username = `${clanTag} ${item.player.username}`;
            const kills = Number(item.playerStats.kills);
            const deaths = Number(item.playerStats.deaths);

            if(data.team === teamName){
                result.ourTeam.players.push({
                    username: username,
                    kills: kills,
                    deaths: deaths,
                });
            }

            if(kills > result.mostKills.count){
                result.mostKills = {
                    username: `${username} (${kills}/${deaths})`,
                    count: kills
                }
            }

            if(deaths > result.mostDeaths.count){
                result.mostDeaths = {
                    username: `${username} (${kills}/${deaths})`,
                    count: deaths
                }
            }

            let team = result.teams[teamPlacement];
            if(!team) team = [];
            team.push(`${username} (${kills}/${deaths})`);
            result.teams[teamPlacement] = team;

        }

        if('success' === response.data.status){
            cbSuccess(result);
        } else {
            cbSuccess([]);
        }

    } catch(err){
        logger.error(err);
        cbError();
    }

}

async function getStats(data, cbSuccess, cbError){

    try {

        let result = [];

        if(!data || data.length === 0){
            cbSuccess([]);
        }

        for(const d of data){
            await getStatsRequest(d, result);
        }

        cbSuccess(result);

    } catch(err){
        logger.error(err);
        cbError();
    }

}

module.exports = {
    getStats: getStats,
    getLastMatches: getLastMatches,
    getMatchDetails: getMatchDetails
}

