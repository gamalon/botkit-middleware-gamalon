const request = require('request');

const API = require('./api');
const {
  wordListAdapter,
  exportCleanUp,
  selectSlot,
  selectSlots,
  selectMultiIntents,
} = require('./utils');

let accessToken;
let clientId;
let clientSecret;
let trainingId;
let tree;
let algorithm = 'revenum';
let multiIntent = false;
let middlewareError;

const setupAccessTokenRefresh = (expires_in) => {
  setTimeout(() => {
    API.fetchAccessToken(clientId, clientSecret).then((body) => {
      accessToken = JSON.parse(body).access_token;
      setupAccessTokenRefresh(body.expires_in);
    });
  }, (expires_in - 100) * 1000);
};

module.exports = function (config) {
  clientId = config.clientId;
  clientSecret = config.clientSecret;
  algorithm = config.algorithm || algorithm;
  multiIntent = config.multiIntent;

  API.fetchAccessToken(clientId, clientSecret).then((body) => {
    const parsedBody = JSON.parse(body);
    accessToken = parsedBody.access_token;
    setupAccessTokenRefresh(parsedBody.expires_in);

    /**
    * As soon as the module is imported, fetch the user's tree and train it. This
    * causes an initial delay after starting the server before classification can
    * occur. However, it makes each classification request faster.
    */
    API.fetchTree(accessToken, config.treeId)
      .then((body) => {
        tree = JSON.parse(body).tree.tree;

        // process tree from DB to conform to truffula schema
        wordListAdapter(tree);
        tree = exportCleanUp(tree);

        API.trainModel(accessToken, tree, algorithm)
          .then((body) => {
            trainingId = JSON.parse(body).data.id;
            console.log('Tree is ready for classification');
          })
          .catch((err) => { middlewareError = `Train Model: ${err}`; });
      })
      .catch((err) => { middlewareError = `Fetch Tree: ${err}`; });
  });

  return (bot, message, res, next) => {
    /**
    * In order to get the middleware functional for ALL steps of the incoming
    * messages pipeline (ingest, normalize, categorize, receive). Some of these
    * steps only pass 3 arguments to the middleware, the third of which is the
    * call to `next`.
    *
    * In order to accomodate both cases, we check if the third parameter is a
    * function and that `next` in undefined. This would indicate that we are
    * dealing with a step that only has three arguments.
    */
    let nextCall = next;

    if (typeof res === 'function' && next === undefined) {
      nextCall = res;
    }

    /**
    * If there was an error with fetching or training the model, classification
    * can't work. Instead we inform the user
    */
    if (middlewareError) {
      message.gamalon = { error: middlewareError };
      nextCall();
    }

    /**
    * Attempt to classify uttterance
    */
    if (accessToken && message.text) {
      API.classifyUtterance(accessToken, trainingId, message.text.toLowerCase(), algorithm)
        .then((body) => {
          const { domains, mostLikelySubtree } = JSON.parse(body).data.attributes;

          if (multiIntent) {
            message.gamalon = {
              subtree: selectMultiIntents(mostLikelySubtree, domains),
              marginals: selectSlots(domains),
            };
          } else {
            message.gamalon = selectSlot(domains);
          }

          nextCall();
        })
        .catch((err) => {
          message.gamalon = { error: err };
          nextCall();
        });;
    }
  };
}
