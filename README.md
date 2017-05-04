<div align="center">
  <h1>
    Mr Dict
  </h1>

  <p>
    <strong>A browser extension helps measure readings not just as a dictionary</strong>
  </p>
</div>

## Backgroud
Like others, I quite often resort to an instant dictionary when reading onto a new word. When another new word pops up, I do this again, sometimes, it also happens on the same one because I just forgot its meaning. The instant dict gives me the answer so quickly that I stop thinking and tend to lookup directly. 

I need a fix to it. So, I came up with Mr Dict. It encourages me to mark new words along with reading and never stops thinking or guessing, and finally it gives me the answers for all, as well as other metrics like:

* How long does it take to read the story?
* How much (how may new words) do I understand the story?
* How many correct guesses do I make?
* How much better do I compare to others?

## Installation
1. Clone the repository `git clone https://github.com/panzhangwang/mrdict.git`
2. Run `npm install`
3. Run `npm run build`

Alternately, if you want to try out the sample extension, here are the download links. After you download it, unzip the file and load it in your browser using the steps mentioned below.
 - [**Download Chrome Extension**](https://github.com/panzhangwang/mrdict/releases/download/v1.0.0/chrome.zip)
 - [**Download Opera Extension**](https://github.com/panzhangwang/mrdict/releases/download/v1.0.0/opera.zip)
 - [**Download Firefox Extension**](https://github.com/panzhangwang/mrdict/releases/download/v1.0.0/firefox.zip)


##### Load the extension in Chrome & Opera
1. Open Chrome/Opera browser and navigate to chrome://extensions
2. Select "Developer Mode" and then click "Load unpacked extension..."
3. From the file browser, choose to `mrdict/build/chrome` or (`mrdict/build/opera`)


##### Load the extension in Firefox
1. Open Firefox browser and navigate to about:debugging
2. Click "Load Temporary Add-on" and from the file browser, choose `mrdict/build/firefox`


## Developing
The following tasks can be used when you want to start developing the extension and want to enable live reload - 

- `npm run chrome-watch`
- `npm run opera-watch`
- `npm run firefox-watch`


## Packaging
Run `npm run dist` to create a zipped, production-ready extension for each browser. You can then upload that to the appstore.

