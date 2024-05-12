import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import "@mdi/font/css/materialdesignicons.css";

import "vuetify/styles";
import { ThemeDefinition, createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const darkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    primary: "rgb(90, 0, 60)",
    error: "rgb(150, 0, 0)",
    success: "rgb(0, 100, 0)",
    secondary: "rgb(40, 40, 40)",
  },
};

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "darkTheme",
    themes: {
      darkTheme,
    },
  },
});

import { initializeApp } from "firebase/app";

//Staging
initializeApp({
  apiKey: "AIzaSyA4fJjqrLhKI8ESWoMYYc-WP2GQNZNFhZk",
  authDomain: "foodplannerstaging.firebaseapp.com",
  projectId: "foodplannerstaging",
  storageBucket: "foodplannerstaging.appspot.com",
  messagingSenderId: "820227252762",
  appId: "1:820227252762:web:696b92d939f65f854967a3",
});
//Live
// initializeApp({
//   apiKey: "AIzaSyAiWBx-rU8kJf5vYBlP658CkOHgTIxIzZg",
//   authDomain: "foodplanner-cae21.firebaseapp.com",
//   projectId: "foodplanner-cae21",
//   storageBucket: "foodplanner-cae21.appspot.com",
//   messagingSenderId: "1024624718650",
//   appId: "1:1024624718650:web:3d6c6b5ad1af83dd3e5603",
// });

createApp(App).use(vuetify).mount("#app");
