import ext from "./ext";

// use local because firefox set sync off by default.
//module.exports = (ext.storage.sync ? ext.storage.sync : ext.storage.local);
module.exports = ext.storage.local;