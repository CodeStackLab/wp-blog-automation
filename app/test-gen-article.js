const config = require('./config.json');
const { generateArticleStream, publishToWordPress } = require('./server.js');
// Wait, generateArticleStream might not be exported.
// Let's check server.js exports.
