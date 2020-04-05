<template>

  <div>

    <div class="row form">
        <form class="form-inline">

            <div class="col-sm">
                <input type="text" class="form-control" placeholder="Digite o Usuário" v-model="player">
            </div>

             <div class="col-sm">
                <select class="form-control" id="platform" v-bind:value="platform" v-on:change="platform = $event.target.value">
                    <option value="psn">PSN</option>
                    <option value="battle">Battle</option>
                    <option value="steam">Steam</option>
                    <option value="xbl">XBL</option>
                    <option value="acti">Uno</option>
                </select>
            </div>

            <div class="col-sm">
                <button class="btn btn-primary" type="button" @click="addPlayer()">
                    <i class="fas fa-plus fa-sm"></i>
                </button>
            </div>

            <div v-show="loading">
                Carregando ...
            </div>

        </form>
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
        loading: false
    }),
    methods: {

        async getStats(players){
            this.loading = true;
            const response = await this.$http.post('/stats', {
                players: players
            });
            this.loading = false;
            return response.data;
        },

        async addPlayer(){

            if(!this.player){
                alert(`Digite o usuário da plataforma selecionada`);
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
            this.data = await this.getStats(this.players);

            this.player = null;

        },

        removePlayer(item){
            this.data.splice(this.data.indexOf(item), 1);
            this.players.splice(this.data.indexOf(this.players.filter( p => p.player === item.username)[0]), 1);
        },

        beforeDestroy () {
            clearInterval(this.timer)
        }

    },

    async created(){
        this.timer =  setInterval(async () => {
            if(this.players && this.players.length){
                this.data = await this.getStats(this.players);
            }
        }, 5000);
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
    .form {
        padding-bottom: 20px;
    }
</style>
