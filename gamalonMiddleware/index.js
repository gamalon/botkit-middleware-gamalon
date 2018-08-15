const request = require('request');
const API = require('./api');
const { wordListAdapter, pawelExportCleanUp, selectSlot } = require('./utils');

// var postData = JSON.stringify({
//   username: "test@testgamalon.com",
//   password: "testgamalon1",
//   scope: 'openid',
//   client_secret: "Wa8w0HikGnMXcYRayObRzzRE8Rsj87ZbNe_IDYlf0ijgILfLBuNMS4k95dMfgxJ4",
//   audience: 'https://demo.gamalon.com/api',
//   client_id: '6k6MjBzkLLOwUmfMy0NhPdiWGgyW9BpO',
//   grant_type: 'password',
// });

let accessToken;
let trainingId;
let tree;
let algorithm = 'revenum';
let middlewareError;

module.exports = function (config) {
  accessToken = config.accessToken;

  API.fetchTree(accessToken, config.treeId)
    .then((body) => {
      tree = JSON.parse(body).tree.tree;
      wordListAdapter(tree);
      tree = pawelExportCleanUp(tree);

      API.trainModel(accessToken, tree, algorithm)
        .then((body) => {
          trainingId = JSON.parse(body).data.id;
          console.log('Ready')
        })
        .catch((err) => {
          middlewareError = `Training: ${err}`;
        });
    })
    .catch((err) => {
      console.log(err);
      middlewareError = `Fetch: ${err}`;
    });

  return (bot, message, res, next) => {
    let nextCall = next;

    if (typeof res === 'function' && next === undefined) {
      nextCall = res;
    }

    if (middlewareError) {
      message.gamalon = { error: middlewareError };
      nextCall()
    }


    if (accessToken && message.text) {
      API.classifyUtterance(accessToken, trainingId, message.text, algorithm)
        .then((body) => {
          const domains = JSON.parse(body).data.attributes.domains;
          message.gamalon = selectSlot(domains);
          nextCall();
        })
        .catch((err) => {
          message.gamalon = { error: err };
          nextCall();
        });;
    }
  };
}
