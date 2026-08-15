export const INITIAL_LOADER_SEEN_KEY = "xhub-initial-loader-seen-v2";

export const INITIAL_LOADER_BOOTSTRAP = `try{if(sessionStorage.getItem("${INITIAL_LOADER_SEEN_KEY}")){document.documentElement.classList.add("initial-loader-seen")}else{document.documentElement.classList.add("is-initial-loading")}}catch(e){document.documentElement.classList.add("is-initial-loading")}`;
