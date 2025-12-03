import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./styles/main.css";

// Create and mount the Vue application
const app = createApp(App);

// Use the router for navigation
app.use(router);

// Mount the app to the DOM element with id "app"
app.mount("#app");
