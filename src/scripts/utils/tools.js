import ext from "./ext";
window.browser = typeof browser !== 'undefined' ? browser : chrome;

export const POPENV = (browser.windows ? true : false);

export const HOST = 'http://mrdict.com';

export const getUILanguage = function() {
    let language = ext.i18n.getUILanguage() || 'en';
    if (language.slice(0, 2) === 'en') {
        language = 'en';
    }
    language = language.replace(/_/g, '-');
    return language;
}

export const getAbsoluteURL = function(url) {
    return browser.extension.getURL(url);
}
