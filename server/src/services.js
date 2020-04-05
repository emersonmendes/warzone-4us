'use strict';

const codBaseURL = "https://my.callofduty.com/api/papi-client/";
const axios = require('axios').create({ baseURL: codBaseURL });

async function getStats(data, cbSuccess, cbError){

    try {

        let result = [];

        if(!data || data.length === 0){
            return [];
        }

        for( const d of data){

            const url = `/stats/cod/v1/title/mw/platform/${d.platform}/gamer/${d.player}/profile/type/mp`;
            const response = await axios.get(url);

            if(response.data.status === 'success' && response.data.data.lifetime.mode.br){
                const data = response.data.data;
                const properties = data.lifetime.mode.br.properties;
                result.push({
                    username: data.username,
                    wins: properties.wins,
                    level: data.level,
                    kills: properties.kills,
                    deaths: properties.deaths,
                    balance: properties.kills - properties.deaths
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
        console.log(err);
        cbError();
    }

}

module.exports = {
    getStats: getStats
}