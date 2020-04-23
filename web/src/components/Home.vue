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

                        <div class="col mr-2" v-if="item.error">
                            <div class="h4 font-weight-bold text-primary mb-1">{{item.error}}</div>
                        </div>

                        <div class="col mr-6" v-if="!item.error">
                            <div class="h4 font-weight-bold text-dark mb-1">{{item.username}} <i :class="getPlatformIcon(item.platform)"></i></div>
                            <div class="h6 mb-0 font-weight-bold">Nível: {{item.level}}</div>
                            <div class="h6 mb-0 font-weight-bold">Partidas: {{item.gamesPlayed}}</div>
                            <div class="h6 mb-0 font-weight-bold">Vitórias: {{item.wins}}</div>
                            <div class="h6 mb-0 font-weight-bold">Kills: {{item.kills}}</div>
                            <div class="h6 mb-0 font-weight-bold">Mortes: {{item.deaths}}</div>
                            <div class="h6 mb-0 font-weight-bold">
                                Balanço: <span class="badge badge-pill" v-bind:class="{ 'badge-danger':(item.balance < 0), 'badge-success':(item.balance >= 0)}">{{item.balance}} ( {{Math.round(item.kdRatio * 100) / 100}} ) </span>
                            </div>
                        </div>

                        <a href="#" class="btn-matches text-success" @click="showMatches(item)" data-toggle="tooltip" data-placement="left" title="Ultimas partidas" v-if="!item.error" v-bind:disabled="disableDetailsButton">
                            <i class="fas fa-align-justify fa-sm"></i>
                        </a>

                        <a href="#" class="btn-remove text-danger" @click="removePlayer(item)" data-toggle="tooltip" data-placement="left" title="Remover player" v-if="item.username">
                            <i class="fas fa-trash fa-sm"></i>
                        </a>

                    </div>

                </div>

            </div>
        </div>

    </div>

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
                        <span aria-hidden="true">&times;</span>
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
                                <option value="psn">PSN</option>
                                <option value="battle">Battle</option>
                                <option value="steam">Steam</option>
                                <option value="xbl">XBL</option>
                                <option value="uno">Activision</option>
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
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div class="modal-body">
                    <h6>{{message}}</h6>
                </div>

            </div>
        </div>
    </div>

    <div id="modalMatches" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title">Últimas partidas</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" data-toggle="tooltip" data-placement="left" title="Fechar">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div class="modal-body">
                    <table class="table table-striped table-sm">
                            <thead class="thead-dark">
                                <tr>
                                    <th scope="col" style="font-size: 13px; width: 5%;">Pos</th>
                                    <th scope="col" style="font-size: 13px; width: 5%;">Kills</th>
                                    <th scope="col" style="font-size: 13px; width: 10%;">Mortes</th>
                                    <th scope="col" style="font-size: 13px; width: 5%;">HS</th>
                                    <th scope="col" style="font-size: 13px; width: 10%;">Players</th>
                                    <th scope="col" style="font-size: 13px; width: 33%;">Time</th>
                                    <th scope="col" style="font-size: 13px; width: 32%;">Time Vencedor</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="match in matches" v-bind:key="match.matchID" style="font-size: 13px;">
                                    <td style="width: 5%;">{{match.teamPlacement}}</td>
                                    <td style="width: 5%;">{{match.kills}}</td>
                                    <td style="width: 10%;">{{match.deaths}}</td>
                                    <td style="width: 5%;">{{match.headshots}}</td>
                                    <td style="width: 10%;">{{match.playerCount}}</td>
                                    <td style="width: 33%;">
                                        <div v-for="p in match.ourTeam" v-bind:key="p">{{p}}</div>
                                    </td>
                                    <td style="width: 32%;">
                                        <div v-for="p in match.champTeam" v-bind:key="p">{{p}}</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                </div>

            </div>
        </div>
    </div>

  </div>

</template>

<script>

/* global $ */

export default {
    name: 'Home',
    data: () => ({
        data: [],
        platform: 'psn',
        player: null,
        players: [],
        loading: true,
        platformIcons: [],
        updateTimeout: 30,
        updateSecond: 0,
        message: '',
        disableUpdateButton: false,
        disableDetailsButton: false,
        matches: []
    }),
    methods: {

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
            this.player = null;
            this.resetTime();
        },

        addPlayer(){

            if(!this.player){
                this.showMessage("Digite o usuário da plataforma selecionada");
                return;
            }

            if(this.players.length >= 4){
                this.showMessage("Máximo de players permitidos: 4");
                return;
            }

            if(this.players.filter( p => p.player === this.player).length){
                this.showMessage(`O usuário ${this.player} ja está na lista.`);
                return;
            }

            this.clearPulling();

            this.players.push({
                player: this.player,
                platform: this.platform
            });

            this.setPlayersToStorage(this.players);

            this.updatePlayersData();

            this.setPulling();

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
            this.updateSecond = this.updateTimeout;
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
            const iconClass = this.platformIcons[platform];
            if(!iconClass){
                return this.platformIcons["default"];
            }
            return iconClass;
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
        }

    },

    async created(){
        this.platformIcons = {
            psn: "fab fa-playstation",
            xbl: "fab fa-xbox",
            default: "fa fa-desktop"
        };
        this.players = this.getPlayersFromStorage();
        this.data = await this.getStats(this.players);
        this.setPulling();
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
        margin: 65px 25px;
    }
    .update-btn {
        position: fixed;
        bottom: 0;
        right: 0;
        margin: 65px 75px;
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
        border-left: 9px solid #4e73df !important;
    }
    .spinner-border-sm {
        width: 14px;
        height: 14px;
        border-width: 3px;
        margin-bottom: 4px;
    }

    table {
        width: 100%;
    }

    thead,
    tbody,
    tr,
    td,
    th {
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

</style>
