import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'
import './assets/styles.css'

const app = createApp(App)

app.use(router)
app.use(store)

app.mount('#app')