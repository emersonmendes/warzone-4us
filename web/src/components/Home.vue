<template>

  <div>

    <div class="loading" v-show="loading">
        Carregando ...
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
                            <div class="h4 font-weight-bold text-primary mb-1">{{item.username}}</div>
                            <div class="h6 mb-0 font-weight-bold">Nível: {{item.level}}</div>
                            <div class="h6 mb-0 font-weight-bold">Partidas: {{item.gamesPlayed}}</div>
                            <div class="h6 mb-0 font-weight-bold">Vitórias: {{item.wins}}</div>
                            <div class="h6 mb-0 font-weight-bold">Execuções: {{item.kills}}</div>
                            <div class="h6 mb-0 font-weight-bold">Mortes: {{item.deaths}}</div>
                            <div class="h6 mb-0 font-weight-bold">Balanço: <span class="badge badge-pill" v-bind:class="{ 'badge-danger':(item.balance < 0), 'badge-success':(item.balance >= 0)}">{{item.balance}} </span></div>
                        </div>

                        <a href="#" class="btn btn-danger" @click="removePlayer(item)">
                            <i class="fas fa-trash fa-sm"></i>
                        </a>

                    </div>

                </div>

            </div>
        </div>

    </div>

    <button class="btn btn-primary add-btn" type="button" data-toggle="modal" data-target=".modal-add-player">
        <i class="fas fa-plus fa-sm"></i>
    </button>

    <!-- modal -->
    <div id="modalAddPlayer" class="modal fade modal-add-player" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-sm modal-dialog-centered">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title"></h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
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

  </div>

</template>

<script>

  export default {
    name: 'Home',
    data: () => ({
        data : [],
        platform: 'psn',
        player: null,
        players: [],
        loading: true
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

        async updatePlayersData(){
            this.data = await this.getStats(this.players);
            this.player = null;
        },

        addPlayer(){

            if(!this.player){
                alert("Digite o usuário da plataforma selecionada");
                return;
            }

            if(this.players.filter( p => p.player === this.player).length){
                alert(`O usuário ${this.player} ja está na lista.`);
                return;
            }

            this.players.push({
                player: this.player,
                platform: this.platform
            });

            this.setPlayersToStorage(this.players);

            this.updatePlayersData();

        },

        removePlayer(item){
            this.clearPulling();
            this.data.splice(this.data.indexOf(item), 1);
            this.players.splice(this.data.indexOf(this.players.filter( p => p.player === item.username)[0]), 1);
            this.setPlayersToStorage(this.players);
            this.setPulling();
        },

        setPulling(){

            const TIMEOUT = 5000

            this.timer = setInterval(async () => {
                this.data = await this.getStats(this.players);
            }, TIMEOUT);

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
        }

    },

    async created(){
        this.players = this.getPlayersFromStorage();
        this.data = await this.getStats(this.players);
        this.setPulling();
    }

  }
</script>

<style scoped>
    .badge {
        font-size: 13px;
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
    .loading {
        position: absolute;
        top: 0;
        right: 0;
        padding: 23px;
    }
    .modal-header{
        padding: 5px 16px;
    }
</style>
