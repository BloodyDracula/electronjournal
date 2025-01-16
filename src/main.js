import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Импортируем router
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap'; // Если нужны JavaScript-компоненты Bootstrap

createApp(App)
    .use(router) // Подключаем Vue Router
    .mount('#app');