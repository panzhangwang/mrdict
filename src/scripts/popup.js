import ext from "./utils/ext";
import storage from "./utils/storage";
import fetchData from './utils/fetchData';
import googleTranslateTk from './utils/googleTranslateTk';
import {getUILanguage, HOST} from './utils/tools';
const ac = new (window.AudioContext || window.webkitAudioContext)();

const HEADER = `<p class="appname">Mr Dict <a class="options right" href="#">
  <i class="tiny material-icons">language</i></a></p>`;

function getGoogleSpeechURL(option) {
  return googleTranslateTk(option.q).then(function(hostAndTk) {
      const {host, tk} = hostAndTk;
      let url = host + '/translate_tts?ie=UTF-8&total=1&idx=0&client=t&prev=input';
      url += `&textlen=${option.q.length}&tl=${option.tl}&tk=${tk}&q=${option.q}&ttsspeed=1`;
      return url;
  });
}


$(document).on('click',".scroll",function() {
  const elm = this.id;
  ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const activeTab = tabs[0];
    ext.tabs.sendMessage(activeTab.id, { action: 'scroll', elm: elm });
  });
  return false;
});


$(document).on('click',".guess",function() {
  const url = $(this).closest('.marked').attr('id');
  const index = parseInt(this.id);
  const checked = $(this).is(':checked');
  let hits = 0;

  storage.get('cart', function(resp) {
    if (resp && resp.cart) {
      const cart = resp.cart;
      for (var i = 0; i < cart.words.length; i++) {
        if(index === i){
          cart.words[index][5] = checked;
        }
        if (cart.words[i][5]) {
          hits ++;
        }
      }
      storage.set({ cart: cart });
      $('.hits').text(hits);
    }
  });
});

$(document).on('click',".options",function() {
	ext.tabs.create({'url': ext.extension.getURL('options.html')});
});

$(document).on('click',".compete",function() {
  const url = this.id;
  const title = $(this).attr('name');
  const lang = $(this).attr('lang');
  const count = $(this).attr('count');
  const duration = $(this).attr('duration');
  const ml = $(this).attr('ml');

  storage.get('cart', function(resp) {
    if (resp && resp.cart) {
      const cart = resp.cart;
      cart.voted = true;

      let hits = 0;
      for (var i = 0; i < cart.words.length; i++) {
        if(cart.words[i][5]){
          hits ++;
        }
      }

      storage.set({ cart: cart }, function(){
        ext.tabs.create({
          url : HOST + '/c?u=' + encodeURIComponent(url) + '&t=' + encodeURI(title) +
          '&l=' + lang + '&m=' + ml + '&c=' + count + '&d=' + duration + '&h=' + hits},
          function(tab) {
        });
      });
    }
  });
});

$(document).on('click',".remove",function() {
  const elm = this.id;

  storage.get('cart', function(resp) {
    if (resp && resp.cart) {
      const cart = resp.cart;

      const words = [];
      for (var i = 0; i < cart.words.length; i++) {
        if(cart.words[i][2] != elm){
          words.push(cart.words[i]);
        }
      }
      cart.words = words;

      storage.set({ cart: cart });
      ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const activeTab = tabs[0];
        ext.tabs.sendMessage(activeTab.id, { action: 'removeHighlight', elm: elm });
      });
    }
  });
});

$(document).on('click',".voice",function() {
  const text = this.id;
  const lang = this.lang;

  const option = {
    tl: lang,
    q: text
  };
  getGoogleSpeechURL(option).then(function(url) {
    fetchData({url, type: 'arrayBuffer'}).then(function(arraybuffer){
        ac.decodeAudioData(arraybuffer).then(function(buffer) {
          const source = ac.createBufferSource();
          source.buffer = buffer;
          source.connect(ac.destination);
          source.start(0);
          reslove();
        }).catch(function(error){
        });
    }).catch(function(error){
    });
  });
});

$(document).on('click',".start",function() {
  storage.get('cart', function(resp) {
    if (resp && resp.cart) {
      const cart = resp.cart;
      cart.start = Date.now();
      storage.set({ cart: cart }, function(){
        ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
          const activeTab = tabs[0];
          ext.tabs.sendMessage(activeTab.id, { action: 'start_hint'});
          window.close();
        });
      });
    }

  });
});

$(document).on('click',".end",function() {
  const url = this.id;
  const title = this.title;
  let readMode = $(this).attr('rmode');
  readMode = readMode == 'false' ? false : true;

  const data = { url, title, readMode  };
  storage.get('cart', function(resp) {
    if (resp && resp.cart) {
      const cart = resp.cart;
      cart.end = Date.now();
      cart.done = true;

      storage.set({ cart: cart }, function(){
        const displayContainer = document.getElementById("display-container");
        displayContainer.innerHTML = templateList(data, cart);
      });
    }

  });
});

$(document).on('click',".startNew",function() {
  const url = this.id;
  const title = this.title;

  storage.get('cart', function(resp) {
    if (resp && resp.cart) {
      const cart = resp.cart;
      cart.url = url;
      cart.title = title;
      cart.start = Date.now();
      cart.end = 0;
      cart.done = false;
      cart.voted = false;
      cart.langs = [];
      cart.words = [];
      storage.set({ cart: cart }, function(){
        ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
          const activeTab = tabs[0];
          ext.tabs.sendMessage(activeTab.id, { action: 'start_hint'});
          window.close();
        });
      });
    }
  });
});

/*
 * main template
 */
const template = (data, cartData) => {
  let s = HEADER;

  if (cartData.url == data.url) {

    if (cartData.start == 0 && cartData.end == 0) {
      // render start reading
      s += `<div class="well">${data.title}</div>`;
      return s += `<footer class="footer center-align">
      <a href="#" id="${data.url}" class="start btn waves-effect waves-light">Start Reading</a></footer>`;
    }
    if (cartData.start > 0 && cartData.end == 0) {
      s += `<p>Words pending to lookup:</p>`;
      cartData.words.map((item, index) => {
        if (item[3] == data.readMode) {
          s += `<div class="chip">${item[0]}
          <a href="#" id="${item[2]}" class="remove"><i class="close material-icons">close</i></a>
          </div>`;
        }
      });

      return s += `<footer class="footer center-align">
        <a href="#" id="${data.url}" title="${data.title}" rmode="${data.readMode}"
        class="end btn waves-effect waves-light red">End Reading</a></footer>`;

    }
    if (cartData.done) {
      return templateList(data, cartData);
    }

  } else {
    // render start on this page
    if (cartData.start > 0 && cartData.end == 0) {
      s += `<h5>You were on:</h5><div class="well">${cartData.title}</div>`;
      return s += `<footer class="footer center-align"><a href="#" id="${data.url}" title="${data.title}" class="startNew btn waves-effect orange waves-light">Stop and Start New</a></footer>`;
    }
    s += `<h5>You are on:</h5><div class="well">${data.title}</div>`;
    return s += `<footer class="footer center-align"><a href="#" id="${data.url}" title="${data.title}" class="startNew btn waves-effect waves-light">Start Reading</a></footer>`;
  }
}

const templateList = (data, cartData) => {
  const duration = cartData.end - cartData.start;
  const hd = humanizeDuration(duration, { language: getUILanguage(), round: true });

  let s = HEADER;
  if (!cartData.words.length) {
    return s + `<p>Completed in: ${hd}, no new words to lookup.</p>`;
  }

  let hits = 0;
  for (var i = 0; i < cartData.words.length; i++) {
    if (cartData.words[i][5]) {
      hits ++;
    }
  }

  const disabled = cartData.voted ? 'disabled': '';

  cartData.words.map((item, index) => {
    const checked = item[5] ? 'checked="checked"' : '';

    if (item[3] == data.readMode) {
      s += `<div id="${data.url}" class="marked">
      <div class="row">
        <div class="col s10">
          <a href="#" id="${item[2]}" class="scroll">${item[0]}</a>
          <a href="#" id="${item[0]}" lang="${item[4]}" class="voice"><i class="tiny material-icons">volume_up</i></span></a>
        </div>
        <div class="col s2">
          <input type="checkbox" id="${index}" class="guess" ${checked} ${disabled}>
          <label for="${index}" class="right"></label>
        </div>
        <div class="col s12">
          <div class="trans">${item[1]}</div>
        </div>
      </div>
      </div>`;
    }
  });

  if (!cartData.voted) {
    s += `<div class="orange-text text-darken-4">${hd} <div class="right">Correct: <span class="hits">${hits}</span></div></div>`;
  }

  let counts = {};
  cartData.langs.forEach(function(x) { counts[x] = (counts[x] || 0)+1; });

  const keys = Object.keys(counts);
  let largest = 0;
  let mainLang = '';
  const ml = getUILanguage();

  for (var i=0; i<=keys.length; i++) {
    if (counts[keys[i]] > largest) {
      largest = counts[keys[i]];
      mainLang = keys[i];
    }
  }

  const wordCount = cartData.words.length;

  if (!cartData.voted) {
    s += `<footer class="footer center-align"><a href="#" id="${cartData.url}" name="${cartData.title}" lang="${mainLang}"
  ml="${ml}" count="${wordCount}" duration="${duration}" class="compete btn waves-effect waves-light">
  <i class="material-icons left">cloud</i>
  Compete Anonymously</a></footer>`;
  }

  return s;
}


const renderMessage = (message) => {
  const displayContainer = document.getElementById("display-container");
  displayContainer.innerHTML = `<p class='message'>${message}</p>`;
}

const renderPopup = (data) => {
  const displayContainer = document.getElementById("display-container")

  storage.get('cart', function(resp) {
    let cartData = {
      url: data.url,
      title: data.title,
      start: 0,
      end: 0,
      done: false,
      voted: false,
      langs: [],
      words: []
    };

    if (resp && resp.cart) cartData = resp.cart;
    if (!resp || !resp.cart) {
      storage.set({ cart: cartData});
    }

    if(data) {
      const tmpl = template(data, cartData);
      displayContainer.innerHTML = tmpl;
    } else {
      renderMessage("Sorry, could not extract this page's title and URL" + data)
    }
  });
}

ext.tabs.query({active: true, currentWindow: true}, function(tabs) {
  const activeTab = tabs[0];
  ext.tabs.sendMessage(activeTab.id, { action: 'process-page' }, renderPopup);
});
