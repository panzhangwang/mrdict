import ext from "./utils/ext";
import storage from "./utils/storage";
import {getUILanguage} from './utils/tools';
import langs from "./utils/languages";


$(document).on('click',".change",function() {
  const code = this.id;
  $('#ml').text(langs[code]);
  storage.set({ ml: code });
});

const template = (mlCode) => {
  const keys = Object.keys(langs);

  let s = `<h4>Mother Language: <span id="ml">${langs[mlCode]}</span></h4><div class="row languages">`;
  for (var i=0; i<keys.length; i++) {
    s += `<div class="col s3 lang">
      <a href="#" class="change" id="${keys[i]}">${langs[keys[i]]}</a>
    </div>`;
  }

  s += `</div>`;

  return s;
}

$(document).ready(function() {
  var displayContainer = document.getElementById("display-container");
  let mlCode = getUILanguage();

  storage.get('ml', function(resp) {
    if (resp && resp.ml) {
      mlCode = resp.ml;
    }
    displayContainer.innerHTML = template(mlCode); 
  });  
});