import ext from "./utils/ext";
import storage from "./utils/storage";
import {HOST} from './utils/tools';

function menuOnClick(info, tab) {
  ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    ext.tabs.sendMessage(activeTab.id, { action: 'menu_click' });
  });
}


var contexts = ["selection"];
for (var i = 0; i < contexts.length; i++) {
  var context = contexts[i];
  var title = ext.i18n.getMessage("contextMenu");
  ext.contextMenus.create({"title": title, "contexts":[context], "onclick": menuOnClick});
}


ext.commands.onCommand.addListener(function(command) {
  ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    ext.tabs.sendMessage(activeTab.id, { action: command });
  });
});


ext.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  	let url = request.url;
    let type = request.type || 'text';
    let params = request.params || {};

    if (url) { // async
      fetch(url, params)
        .then(checkStatus)
        .then((response) => {
            switch (type) {
                case 'text':
                    return response.text();
                case 'json':
                    return response.json();
                case 'arrayBuffer':
                    return response.arrayBuffer();
            }
        })
        .then((response) => {
            if(type === 'arrayBuffer') {
                return JSON.stringify(Array.apply(null, new Uint8Array(response)));
            }
            return response;
        })
        .then((response) => { sendResponse(response) })
        .catch((error) => { sendResponse({error: error}) });
      return true;
    }

    if(request.action === "page_loaded") {
    	const url = HOST + '/get?u=' + encodeURIComponent(request.href);
      fetch(url)
        .then(checkStatus)
        .then((response) => response.json())
        .then((response) => {
          ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const activeTab = tabs[0];
            ext.tabs.sendMessage(activeTab.id, { action: 'notify', read: response });
          });
        })
        .catch((error) => { console.log(error); });
    }

    if(request.action === "addToCart") {
      storage.get('cart', function(resp) {
        if(resp && resp.cart){
          let cart = resp.cart;
          cart.words.push([request.text, request.result, request.uuid, request.readMode, request.language, '']);
          cart.langs.push(request.language);
          storage.set({cart: cart}, function() {
            sendResponse({ action: "added to cart" });
          });
        }
      });
    }
  }
);

function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        return response;
    } else {
        let error = new Error(response.statusText);
        error.response = response;
        throw error;
    }
}