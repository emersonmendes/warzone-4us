<template>

  <div>

    <div class="loading" v-show="loading">
        <span class="loading-text">Atualizando ...</span>
    </div>

    <div class="loading" v-show="!loading">
        <span class="loading-text">Atualizando em {{updateSecond}} ...</span>
    </div>

    <div class="row">

        <div v-for="item in data" class="col-xl-3 col-md-6 mb-4" v-bind:key="item.username">
            <div class="card border-left-primary shadow h-100 py-2">
                <div class="card-body">
                    <div class="row no-gutters align-items-center">

                        <div class="col mr-2" v-if="item.error" style="margin-right: 18px !important;">
                            <div class="h4 font-weight-bold  mb-1">{{item.error}}</div>
                        </div>

                        <div class="col mr-6" v-if="!item.error" style="margin-right: 18px !important;">
                            <div class="h4 font-weight-bold text-dark mb-1">{{item.username}} <i :class="getPlatformIcon(item.platform)"></i></div>
                            <div class="h6 mb-0 font-weight-bold">Partidas: {{item.gamesPlayed}}</div>
                            <div class="h6 mb-0 font-weight-bold">Tempo de jogo: {{getFormattedTimePlayed(item.timePlayed)}}</div>
                            <div class="h6 mb-0 font-weight-bold">Vitórias: {{item.wins}}</div>
                            <div class="h6 mb-0 font-weight-bold">Top 5: {{item.topFive}}</div>
                            <div class="h6 mb-0 font-weight-bold">Kills: {{item.kills}}</div>
                            <div class="h6 mb-0 font-weight-bold">Mortes: {{item.deaths}}</div>
                            <div class="h6 mb-0 font-weight-bold">K/D: {{Math.round(item.kdRatio * 100) / 100}}</div>
                            <div class="h6 mb-0 font-weight-bold">
                                Balanço: <span class="badge badge-pill" v-bind:class="{ 'badge-danger':(item.balance < 0), 'badge-success':(item.balance >= 0)}">{{item.balance}}</span>
                            </div>
                        </div>

                        <a href="#" class="btn-matches text-dark" @click="showMatches(item)" data-toggle="tooltip" data-placement="left" title="Ultimas partidas" v-if="!item.error" v-bind:disabled="disableDetailsButton">
                            <i class="fas fa-align-justify fa-sm"></i>
                        </a>

                        <a href="#" class="btn-remove text-dark" @click="removePlayer(item)" data-toggle="tooltip" data-placement="left" title="Remover player" v-if="item.username">
                            <i class="fas fa-trash fa-sm"></i>
                        </a>

                    </div>

                </div>

            </div>
        </div>

    </div>

    <button class="btn btn-warning last-searched-players-btn" type="button" data-toggle="modal" data-target=".modal-last-searched-players">
        <i class="fas fa-history fa-sm" data-toggle="tooltip" data-placement="left" title="Últimos pesquisados"></i>
    </button>

    <button class="btn btn-primary add-btn" type="button" data-toggle="modal" data-target=".modal-add-player">
        <i class="fas fa-plus fa-sm" data-toggle="tooltip" data-placement="left" title="Adicionar player"></i>
    </button>

    <button class="btn btn-success update-btn" type="button" @click="callUpdatePlayersData()" v-bind:disabled="disableUpdateButton">
        <i class="spinner-border spinner-border-sm" v-if="disableUpdateButton"></i>
        <i class="fas fa-sync fa-sm" data-toggle="tooltip" data-placement="left" title="Atualizar" v-if="!disableUpdateButton"></i>
    </button>

    <!-- modals -->

    <div id="modalAddPlayer" class="modal fade modal-add-player" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-sm modal-dialog-centered">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title"></h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" data-toggle="tooltip" data-placement="left" title="Fechar">
                        <i class="fas fa-times fa-sm"/>
                    </button>
                </div>

                <div class="modal-body">

                    <form class="form">

                        <div class="form-group">
                            <label >Usuário:</label>
                            <input type="text" class="form-control" v-model="player">
                        </div>

                        <div class="form-group">
                            <label >Plataforma:</label>
                            <select class="form-control" id="platform" v-bind:value="platform" v-on:change="platform = $event.target.value">
                                <option value="psn">{{getPlatformName("psn")}}</option>
                                <option value="battle">{{getPlatformName("battle")}}</option>
                                <option value="steam">{{getPlatformName("steam")}}</option>
                                <option value="xbl">{{getPlatformName("xbl")}}</option>
                                <option value="uno">{{getPlatformName("uno")}}</option>
                            </select>
                        </div>

                        <button class="btn btn-primary" type="button" @click="addPlayer()" data-dismiss="modal">
                            Adicionar
                        </button>

                    </form>

                </div>

            </div>
        </div>
    </div>

    <div id="modalMessage" class="modal fade modal-message" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-sm modal-dialog-centered">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-exclamation-triangle fa-sm"></i></h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" data-toggle="tooltip" data-placement="left" title="Fechar">
                        <i class="fas fa-times fa-sm"/>
                    </button>
                </div>

                <div class="modal-body">
                    <h6>{{message}}</h6>
                </div>

            </div>
        </div>
    </div>

    <div id="modalMatches" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title">Últimas partidas <b>{{ matches[0] ? matches[0].username : ''}}</b></h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" data-toggle="tooltip" data-placement="left" title="Fechar">
                        <i class="fas fa-times fa-sm"/>
                    </button>
                </div>

                <div class="modal-body">
                    <table class="table table-striped table-sm">
                        <thead class="thead-dark">
                            <tr>
                                <th scope="col" class="col1">Data</th>
                                <th scope="col" class="col2">Modo</th>
                                <th scope="col" class="col3">Privada</th>
                                <th scope="col" class="col4">Pos</th>
                                <th scope="col" class="col5"><b>Kills</b></th>
                                <th scope="col" class="col6">Mortes</th>
                                <th scope="col" class="col7">Jogadores</th>
                                <th scope="col" class="col8">Times</th>
                                <th scope="col" class="col9">Duração</th>
                                <th scope="col" class="col10">Acão</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="match in matches" v-bind:key="match.matchID" style="font-size: 13px;">
                                <td class="col1">{{getDateTime(match.utcStartDate)}}</td>
                                <td class="col2">{{getMode(match.mode)}}</td>
                                <td class="col3">{{match.privateMatch ? 'Sim' : 'Não'}}</td>
                                <td class="col4">{{ match.mode.includes('plnbld') ? '?' : match.teamPlacement}}</td>
                                <td class="col5"><b>{{match.kills}}</b></td>
                                <td class="col6">{{match.deaths}}</td>
                                <td class="col7">{{match.playerCount}}</td>
                                <td class="col8">{{match.teamCount}}</td>
                                <td class="col9">{{getFormattedMatchDuration(match.duration)}}</td>
                                <td class="col10">
                                    <a href="#" v-bind:disabled="disableMatchDetailsButton" data-toggle="tooltip" data-placement="left" title="Detalhes partida" @click="showMatchDetails(match)">
                                        <i class="fas fa-plus fa-sm" style="color:white"></i>
                                    </a>
                                </td>

                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    </div>

    <div id="modalLastSearchedPlayers" class="modal fade modal-last-searched-players" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-sm modal-dialog-centered">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title">
                        Últimos pesquisados
                    </h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" data-toggle="tooltip" data-placement="left" title="Fechar">
                        <i class="fas fa-times fa-sm"/>
                    </button>
                </div>

                <div class="modal-body">
                    <table class="table table-striped table-sm">
                        <thead class="thead-dark">
                            <tr>
                                <th scope="col" style="min-width: 80%;">Username</th>
                                <!-- <th scope="col" style="min-width: 25%;">Plataforma</th> -->
                                <th scope="col" style="min-width: 10%;color: #5a5c69;">z</th>
                                <th scope="col" style="min-width: 10%;color: #5a5c69;">z</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in lastSearchedPlayers" v-bind:key="item.player" style="font-size: 13px;">
                                <td style="min-width: 80%;">{{item.player}}</td>
                                <!-- <td style="min-width: 25%;">{{getPlatformName(item.platform)}}</td> -->
                                <td style="min-width: 10%;">
                                    <i type="button" class="fas fa-plus fa-sm" title="Adicionar player" @click="addPlayer(item)" data-dismiss="modal"></i>
                                </td>
                                <td style="min-width: 10%;">
                                    <i type="button" class="fas fa-trash fa-sm" title="Remover player" @click="removePlayerFromLastPlayersSearched(item)" data-dismiss="modal"></i>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    </div>

    <div id="modalMatchDetails" class="modal fade modal-match-details" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title">
                        Detalhes da partida
                    </h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" data-toggle="tooltip" data-placement="left" title="Fechar">
                        <i class="fas fa-times fa-sm"/>
                    </button>
                </div>

                <div class="modal-body" v-if="matchDetails.ourTeam">

                    <b>Time:</b>
                    <div  v-for="item in matchDetails.ourTeam.players" v-bind:key="item.username">
                        {{item.username}} <b>Kills:</b> {{item.kills}} <b>Mortes:</b> {{item.deaths}}
                    </div>
                    <br />
                    <b>Jogador que mais matou:</b>
                    <div>{{matchDetails.mostKills.username}}</div>
                    <br />
                    <b>Jogador que mais morreu:</b>
                    <div>{{matchDetails.mostDeaths.username}}</div>
                    <br />
                    <b>Times por posição na partida:</b>
                    <div class="teamsPerPosition" v-for="(item, key) in matchDetails.teams" v-bind:key="item.username">
                       {{key}} - {{item.join(" , ")}}
                    </div>
                </div>

            </div>
        </div>
    </div>

  </div>

</template>

<script>

/* global $ */

import moment from 'moment';

export default {
    name: 'Home',
    data: () => ({
        data: [],
        platform: 'psn',
        player: null,
        players: [],
        loading: true,
        platformData: [],
        message: '',
        disableUpdateButton: false,
        disableDetailsButton: false,
        disableMatchDetailsButton: false,
        matches: [],
        match: {},
        lastSearchedPlayers: [],
        updateSecond: 0,
        UPDATE_TIMEOUT: 30,
        MAX_ALLOWED_PLAYES: 4,
        matchDetails: {}
    }),
    methods: {

        getMode(mode){

            if(mode === 'br_dmz_plnbld') return 'Saque';
            if(mode === 'br_brduos') return 'Dupla';
            if(mode === 'br_brsolo') return 'Solo';
            if(mode === 'br_brtrios') return 'Trio';
            if(mode === 'br_brquads') return 'Quarteto';

            return '';

        },

        addZero(i) {
            if (i < 10) {
                i = "0" + i;
            }
            return i;
        },

        getDateTime(milli){
            const date = new Date(milli);
            return `${this.addZero(date.getDate())}/${this.addZero(date.getMonth() + 1)}/${date.getFullYear()} ${this.addZero(date.getHours())}:${this.addZero(date.getMinutes())}`;
        },

        async getStats(players){

            this.loading = true;

            if(!players || !players.length){
                this.loading = false;
                return [];
            }

            const response = await this.$http.post('/stats', { players: players });

            this.loading = false;

            return response.data;

        },

        async getMatches(platform, username){
            this.disableDetailsButton = true;
            const response = await this.$http.get('/matches', {
                params: { platform, username }
            });
            this.disableDetailsButton = false;
            return response.data;
        },

        callUpdatePlayersData(){
            this.disableUpdateButton = true;
            setTimeout(() => {
                this.disableUpdateButton = false;
            }, 5000);
            this.updatePlayersData();
        },

        async updatePlayersData(){
            this.data = await this.getStats(this.players);
            this.resetTime();
        },

        addPlayer(item){

            if(item){
                this.player = item.player;
                this.platform = item.platform;
            }

            if(!this.player){
                this.showMessage("Digite o usuário da plataforma selecionada");
                return;
            }

            if(this.players.length >= this.MAX_ALLOWED_PLAYES){
                this.showMessage(`Máximo de players permitidos: ${this.MAX_ALLOWED_PLAYES}`);
                return;
            }

            if(this.players.filter( p => p.player === this.player).length){
                this.showMessage(`O usuário ${this.player} ja está na lista.`);
                return;
            }

            this.clearPulling();

            const playerObj = {
                player: this.player,
                platform: this.platform
            };

            this.players.push(playerObj);
            this.setPlayersToStorage(this.players);
            this.updatePlayersData();
            this.setPulling();

            this.addPlayerToLastPlayersSearched(playerObj);

        },

        removePlayer(item){
            this.clearPulling();
            this.data = this.data.filter(d => (d.username !== item.username) ||  (d.error && !d.username));
            if(item.username){
                this.players = this.players.filter( p => p.player !== item.username);
                this.setPlayersToStorage(this.players);
            }
            this.setPulling();
            $('[data-toggle="tooltip"]').tooltip('dispose');
        },

        setPulling(){
            this.resetTime();
            this.timer = setInterval(async () => {
                if(this.updateSecond === 1){
                    this.updatePlayersData();
                    this.resetTime();
                } else {
                    this.updateSecond -= 1;
                }
            }, 1000);
        },

        resetTime(){
            this.updateSecond = this.UPDATE_TIMEOUT;
        },

        clearPulling() {
            clearInterval(this.timer);
        },

        beforeDestroy() {
            this.clearPulling();
        },

        getPlayersFromStorage(){
            if(localStorage.players){
                return JSON.parse(localStorage.getItem("players"));
            }
            return [];
        },

        setPlayersToStorage(players){
            localStorage.setItem("players", JSON.stringify(players));
        },

        getPlatformIcon(platform){
            return this.platformData[platform].icon;
        },

        getPlatformName(platform){
            if(!platform){
                return "";
            }
            return this.platformData[platform].name;
        },

        showMessage(_message){
            this.message = _message;
            $('#modalMessage').modal('show');
        },

        async showMatches(item){
            if(this.disableDetailsButton){
                return;
            }
            this.matches = await this.getMatches(item.platform, item.username);
            $('#modalMatches').modal('show');
        },

        getFormattedMatchDuration(ms) {
            const duration = new moment.duration(ms);
            return `${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;
        },

        getFormattedTimePlayed(seconds) {
            const ms = seconds * 1000;
            const duration = new moment.duration(ms);
            return `${duration.days()}d ${duration.hours()}h ${duration.minutes()}m`;
        },

        setLastPlayersSearchedToStorage(lastSearchedPlayers){
            localStorage.setItem("lastSearchedPlayers", JSON.stringify(lastSearchedPlayers));
        },

        addPlayerToLastPlayersSearched(item){
            if(item.player && item.platform && !this.lastSearchedPlayers.filter( p => p.player === item.player).length){
                this.lastSearchedPlayers.push(item);
                this.setLastPlayersSearchedToStorage(this.lastSearchedPlayers);
            }
        },

        removePlayerFromLastPlayersSearched(item){
            this.lastSearchedPlayers = this.lastSearchedPlayers.filter(p => p.player !== item.player);
            this.setLastPlayersSearchedToStorage(this.lastSearchedPlayers);
        },

        getLastPlayersSearchedFromStorage(){
            if(localStorage.lastSearchedPlayers){
                return JSON.parse(localStorage.getItem("lastSearchedPlayers"));
            }
            return [];
        },

        async showMatchDetails(match){
            this.disableMatchDetailsButton = true;
            const response = await this.$http.get('/matchDetails', {
                params: {
                    matchID: match.matchID,
                    username: match.username,
                    team: match.team
                }
            });
            this.matchDetails = response.data;
            $('#modalMatchDetails').modal('show');
            this.disableMatchDetailsButton = false;
        }

    },

    async created(){
        this.platformData = {
            psn: { name: "PSN", icon: "fab fa-playstation" },
            xbl: { name: "XBox", icon: "fab fa-xbox" },
            steam: { name: "Steam", icon: "fa fa-desktop" },
            battle: { name: "Battle.net", icon: "fa fa-desktop" },
            uno: { name: "Activision", icon: "fa fa-desktop" }
        };
        this.players = this.getPlayersFromStorage();
        this.data = await this.getStats(this.players);
        this.setPulling();
        this.lastSearchedPlayers = this.getLastPlayersSearchedFromStorage();
    },

    watch: {
        data: function(){
            this.$nextTick(() => $('[data-toggle="tooltip"]').tooltip());
        }
    }

}
</script>

<style scoped>
    .badge {
        font-size: 15px;
    }
    .form-control {
        border: 1px solid #dadada;
    }
    .add-btn {
        position: fixed;
        bottom: 0;
        right: 0;
        margin: 50px 25px;
    }
    .update-btn {
        position: fixed;
        bottom: 0;
        right: 0;
        margin: 50px 75px;
    }
    .last-searched-players-btn {
        position: fixed;
        bottom: 0;
        right: 0;
        margin: 50px 127px;
    }
    .loading {
        position: absolute;
        top: 0;
        right: 0;
        padding: 23px;
    }


    @media (max-width: 576px) {
        .loading-text {
            font-size: 12px;
        }
    }

    @media (max-width: 990px) {
        .modal-dialog {
            max-width: 90% !important;
        }
    }

    .modal-header{
        padding: 5px 16px;
    }
    .btn-remove {
        font-size: 22px;
        position: absolute;
        top: 0;
        right: 0;
        margin: 18px 20px;
    }

    .btn-matches {
        font-size: 22px;
        position: absolute;
        top: 0;
        right: 0;
        margin: 18px 55px;
    }

    .card {
        border-radius: 30px;
        padding-bottom: 0px !important;
        padding-top: 0px !important;
    }
    .border-left-primary {
        border-left: 9px solid #ffffff !important;
    }
    .spinner-border-sm {
        width: 14px;
        height: 14px;
        border-width: 3px;
        margin-bottom: 4px;
    }

    .teamsPerPosition {
        font-size: 14px;
    }

    table {
        width: 100%;
    }

    table > thead > tr {
        font-size: 13px;
        padding-right: 0px;
    }

    thead, tbody, tr, td, th {
        display: block;
    }

    tr:after {
        content: ' ';
        display: block;
        visibility: hidden;
        clear: both;
    }

    tbody {
        height: 400px;
        overflow-y: auto;
    }

    tbody td, thead th {
        float: left;
    }

    .text-dark {
        color:#949494 !important;
    }

    /** colunas tabela */

    .col1 {
        width: 20%;
    }
    .col2 {
        width: 10%;
    }
    .col3 {
        width: 10%;
    }
    .col4 {
        width: 10%;
    }
    .col5 {
        width: 9%;
    }
    .col6 {
        width: 9%;
    }
    .col7 {
        width: 9%;
    }
    .col8 {
        width: 9%;
    }
    .col9 {
        width: 9%;
    }
    .col10 {
        width: 5%;
    }

    @media (max-width: 900px) {
        .col1 {
            width: 20%;
        }
        .col2 {
            width: 15%;
        }
        .col3 {
            display: none;
        }
        .col4 {
            width: 10%;
        }
        .col5 {
            width: 10%;
        }
        .col6 {
            width: 10%;
        }
        .col7 {
            width: 10%;
        }
        .col8 {
            width: 10%;
        }
        .col9 {
            width: 15%;
        }
        .col10 {
            display: none;
        }
    }

    @media (max-width: 575px) {
        .col1 {
            width: 50%;
        }
        .col2 {
            display: none;
        }
        .col3 {
            display: none;
        }
        .col4 {
            width: 13%;
        }
        .col5 {
            width: 15%;
        }
        .col6 {
            width: 22%;
        }
        .col7 {
            display: none;
        }
        .col8 {
            display: none;
        }
        .col9 {
            display: none;
        }
        .col10 {
            display: none;
        }
    }

</style>
