const request = require('request');

const API = require('./api');
const { wordListAdapter, exportCleanUp, selectSlot } = require('./utils');

let accessToken;
let trainingId;
let tree;
let algorithm = 'revenum';
let middlewareError;

module.exports = function (config) {
  accessToken = config.accessToken;

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
      nextCall()
    }

    /**
    * Attempt to classify uttterance
    */
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
