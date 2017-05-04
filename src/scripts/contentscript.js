import ext from "./utils/ext";
import fetchData from './utils/fetchData';
import googleTranslateTk from './utils/googleTranslateTk';
import {getUILanguage} from './utils/tools';
import storage from "./utils/storage";

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

function getGoogleURL(option) {
  return googleTranslateTk(option.q).then(function(hostAndTk) {
    const {host, tk} = hostAndTk;
    let url = host + '/translate_a/single?client=t&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&ie=UTF-8&oe=UTF-8&source=btn&rom=1&srcrom=1&ssel=0&tsel=0&kc=0';
    url += `&sl=${option.from}&tl=${option.to}&hl=${option.hl}&tk=${tk}&q=${option.q}`;
    return url;
  });
}

function getTitle() {
  let title = '';
  const ogTitle = document.querySelector("meta[property='og:title']");
  if(ogTitle) {
    title = ogTitle.getAttribute("content")
  } else {
    title = document.title
  }
  return title;
}

var extractTags = () => {
  let url = document.location.href;
  if(!url || !url.match(/^http/)) return;

  let readMode = document.getElementById('simple-article') ? true : false;
  let data = {
    title: getTitle(),
    description: "",
    cart: "",
    readMode: readMode,
    url: document.location.href
  }

  let descriptionTag = document.querySelector("meta[property='og:description']") || document.querySelector("meta[name='description']")
  if(descriptionTag) {
    data.description = descriptionTag.getAttribute("content")
  }

  return data;
}

function onRequest(request, sender, sendResponse) {
  if (request.action === 'process-page') {
    sendResponse(extractTags());
  }

  if (request.action === 'menu_click' || request.action === 'mark') {
    storage.get('cart', function(resp) {
      let valid = false;
      if (resp && resp.cart) {
        const cart = resp.cart;
        if (cart.url == document.location.href) {
          if (cart.start > 0 && cart.end == 0) {
            valid = true;
          } else {
            return notie.alert({
              type: 'warning',
              position: 'bottom',
              text: 'You cannot mark, because reading has ended on the current page.'
            });
          }
        }
      }
      if (valid) {
        mark();
      } else {
        notie.alert({
          type: 'warning',
          position: 'bottom',
          text: 'Reading NOT started. To start, click the extension icon.'
        });
      }
    });
  }

  if (request.action === 'start_hint') {
    notie.alert({
      type: 'success',
      time: 2,
      position: 'bottom',
      text: 'Reading just getting started. Mark mark then lookup.'
    });
  }

  if (request.action === 'scroll') {
    var $elm = $("."+request.elm);



    if ($elm) {
      var elmOffset;
      var elmHeight;

      var iframe= document.getElementById('simple-article');
      if (iframe) {
        var idoc= iframe.contentDocument || iframe.contentWindow.document;
        var $el = $(iframe).contents().find("."+request.elm);

        elmOffset = $el.offset().top;
        elmHeight = $el.height();
      } else {
        elmOffset = $elm.offset().top;
        elmHeight = $elm.height();
      }

      var windowHeight = window.innerHeight; // $(window).height();
      var offset;

      if (elmHeight < windowHeight) {
        offset = elmOffset - ((windowHeight / 2) - (elmHeight / 2));
      } else {
        offset = elmOffset;
      }

      var iframe= document.getElementById('simple-article');

      if (iframe) {
        var idoc= iframe.contentDocument || iframe.contentWindow.document;
        $(idoc.body).animate({
          'scrollTop': offset
        }, 'slow');
      } else {
        $('body').animate({
          'scrollTop': offset
        }, 'slow');
      }

    }
  }

  if (request.action === 'removeHighlight') {
    var $elm = $("."+request.elm);
    var iframe= document.getElementById('simple-article');
    let text = getSelectionText().trim();
    let readMode = false;

    if (iframe) {
      var idoc= iframe.contentDocument || iframe.contentWindow.document;
      text = (''+idoc.getSelection()).trim();
      readMode = true;
    }

    if ($elm) {
      if (iframe) {
        hltr = new TextHighlighter(iframe.contentDocument.body, {
                highlightedClass: 'highlighted'
              });
        hltr.removeHighlightsByClass(request.elm);
      } else {
        var hltr = new TextHighlighter(document.body, {
                highlightedClass: 'highlighted'
              });
        hltr.removeHighlightsByClass(request.elm);
      }
    }
  }

  if (request.action === 'notify') {
    const read = request.read;
    const readers = read.readers ? read.readers : 0;
    const avgWords = read.words ? read.words : 0;
    const avgDuration = read.duration ? humanizeDuration(read.duration, { round: true }) : '';

    if (readers > 9) {
      storage.get('cart', function(resp) {
        if (resp && resp.cart) {

          const cart = resp.cart;
          const currentURL = document.location.href;

          if (cart.done || cart.start == 0) {
            const msg = readers + ' people have read this, <br>New words avg: ' + avgWords + ', Read time avg: ' + avgDuration;

            notie.confirm({
              position: 'bottom',
              text: msg,
              submitText: 'Read to Challenge',
              submitCallback: function () {
                cart.url = currentURL;
                cart.title = getTitle();
                cart.start = Date.now();
                cart.end = 0;
                cart.done = false;
                cart.voted = false;
                cart.langs = [];
                cart.words = [];
                storage.set({ cart: cart }, function(){
                  notie.alert({
                    type: 'success',
                    time: 2,
                    position: 'bottom',
                    text: 'Reading just getting started. '
                  });
                });
              }
            });
          }
        }
      });
    }
  }
}


function mark() {
  var iframe= document.getElementById('simple-article');
  let text = getSelectionText().trim();
  let readMode = false;

  if (iframe) {
    var idoc= iframe.contentDocument || iframe.contentWindow.document;
    text = (''+idoc.getSelection()).trim();
    readMode = true;
  }

  if (text !== '') {
    if (text.length > 50) {
      return notie.alert({
        type: 'error',
        time: 2,
        position: 'bottom',
        text: 'Selection is too long. It should be less than 50.'
      });
    }
    var uuid = 'm' + guid();

    var option = {
      from: 'auto',
      q: text,
      hl: 'en'
    };

    storage.get('ml', function(resp) {
      option.to = (resp && resp.ml) ? resp.ml : getUILanguage();
      option.hl = (resp && resp.ml) ? resp.ml : getUILanguage();

      getGoogleURL(option).then(function(url) {
        fetchData({ url, type: "text" }).then(function(responseText) {
          responseText = responseText.replace(/\[,/g, '[null,');
          responseText = responseText.replace(/,\]/g, ',null]');
          responseText = responseText.replace(/,{2,}/g, function(result) {
              return result.split('').join('null')
          });
          let result = JSON.parse(responseText);

          const language = result[2];
          const transTxt = result[0][0][0];


          if (transTxt) {
            if (iframe) {
              hltr = new TextHighlighter(iframe.contentDocument.body, {
                highlightedClass: 'highlighted ' + uuid
              });
              hltr.doHighlight();
              hltr.find(text, false);
            } else {
              var hltr = new TextHighlighter(document.body,{
                highlightedClass: 'highlighted ' + uuid
              });
              hltr.doHighlight();
              hltr.find(text, false);
            }
            ext.runtime.sendMessage({ text, result: transTxt, uuid, readMode, language, action: "addToCart", href: document.location.href });
          } else {
            notie.alert({
              type: 'warning',
              time: 2,
              position: 'bottom',
              text: 'Google translate failed. Try again later.'
            });
          }

        });
      });
    });

  }
}

ext.runtime.onMessage.addListener(onRequest);

$(function() {
  ext.runtime.sendMessage({ action: "page_loaded", href: document.location.href, title: getTitle() });
});