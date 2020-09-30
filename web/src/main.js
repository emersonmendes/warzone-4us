import Vue from 'vue';
import App from './App.vue';

import axios from 'axios';
import router from './router';

Vue.config.productionTip = false;

Vue.prototype.$http = axios.create({
    baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:8080/api' : 'api'
});

new Vue({
    router,
    render: h => h(App)
}).$mount('#app');
