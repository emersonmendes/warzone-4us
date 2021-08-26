'use strict';

const logger = require('./logger');
const axios = require('axios');
const querystring = require('querystring');

const codBaseURL = "https://api.tracker.gg/api/v2";

const http = axios.create({ baseURL: codBaseURL });

const header = {
    "Cookie": "authority=api.tracker.gg; origin=https://cod.tracker.gg; referer=https://cod.tracker.gg/;"
};

async function parseMatchesData(data){
    const matches = [];
    for(const item of data){

        const stats = item.segments[0].stats;
        const metadata = item.segments[0].metadata;
        const team = metadata.teammates || [];
        const username = metadata.platformUserHandle;

        team.push({
            platformUserHandle: metadata.platformUserHandle,
            clantag: metadata.clanTag,
            stats: {
                kills: stats.kills.value,
                deaths: stats.deaths.value
            }
        });

        matches.push({
            matchId: item.attributes.id,
            username: username,
            team: team,
            teamPlacement: ((stats.teamPlacement && stats.teamPlacement.displayValue) || (stats.placement && stats.placement.displayValue)),
            kills: stats.kills.value,
            deaths: stats.deaths.value,
            mode: item.metadata.modeName,
            duration: item.metadata.duration.value,
            playerCount: item.metadata.playerCount,
            teamCount: item.metadata.teamCount,
            timestamp: item.metadata.timestamp
        });
    }
    return matches;
}

async function getMatchPlayers(matchId, cbSuccess, cbError){

    const url = `/warzone/standard/matches/${matchId}`;

    const response = await http.get(url, { headers: header });

    const matchPlayes = {};

    for(const item of response.data.data.segments){

        if(item.metadata){

            const placement = item.metadata.placement.displayValue;

            if(!matchPlayes[placement]){
                matchPlayes[placement] = [];
            }

            matchPlayes[placement].push({
                tag: item.metadata.clanTag,
                player: item.metadata.platformUserHandle,
                kills: item.stats.kills.value,
                deaths: item.stats.deaths.value
            });

        }

    }

    try {
        if(200 === response.status){
            cbSuccess(matchPlayes);
        }else {
            cbSuccess([]);
        }
    } catch(err){
        logger.error(err);
        cbError();
    }

}

async function getLastMatches(platform, player, cbSuccess, cbError){

    const url = `/warzone/standard/matches/${platform}/${querystring.escape(player)}?type=wz`;

    try {

        const response = await http.get(url, { headers: header });

        if(200 === response.status){
            const matchesData = await parseMatchesData(response.data.data.matches);
            cbSuccess(matchesData);
        } else {
            cbSuccess([]);
        }

    } catch(err){
        logger.error(err);
        cbError();
    }

}

async function getStatsRequest(reqData, result){

    const url = `/warzone/standard/profile/${reqData.platform}/${querystring.escape(reqData.player)}`;

    const response = await http.get(url, { headers: header });

    if(response.status === 200){

        const data = response.data.data;

        const segments = data.segments[1];

        result.push({
            username: data.platformInfo.platformUserIdentifier,
            platform: data.platformInfo.platformSlug,
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
    getMatchPlayers: getMatchPlayers
}

