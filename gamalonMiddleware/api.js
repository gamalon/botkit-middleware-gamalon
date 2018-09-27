const request = require('request');

// Declare API endpoints
const lionessENDPOINT = 'https://app.gamalon.com/lioness';
const burrowENDPOINT = 'https://app.gamalon.com/burrow';

module.exports = {
  fetchAccessToken: (clientId, clientSecret) => {
    const url = 'https://gamalon.auth0.com/oauth/token';
    const headers = { 'Content-Type': 'application/json' };
    const body = JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience: "https://demo.gamalon.com/api",
      grant_type: "client_credentials",
    });
    console.log(17)
    return apiRequest('post', headers, url, body);
  },

  /**
  * Fetches the tree specified by the treeId. The user specified by the
  * accessToken must be authroized to use the tree.
  * Returns a promise.
  */
  fetchTree: (accessToken, treeId) => {
    const url = `${burrowENDPOINT}/idea-tree/${treeId}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
    // console.log(32, headers, url)
    return apiRequest('get', headers, url);
  },

  /**
  * Trains a model with lioness and fetches the trainingId to be used for
  * classification.
  * Returns a promise.
  */
  trainModel: (accessToken, tree, algorithm) => {
    const url = `${lionessENDPOINT}/classifiers?algorithm=${algorithm}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
    const body = JSON.stringify({
      data: {
        attributes: {
          tree,
        },
        type: 'classifier',
      },
    });

    return apiRequest('post', headers, url, body);
  },

  /**
  * Classifys and utterance with the model specified by the trainingId.
  * Returns a promise.
  */
  classifyUtterance: (accessToken, trainingId, utterance, algorithm) => {
    const url = `${lionessENDPOINT}/classifiers/${trainingId}/prediction?algorithm=${algorithm}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
    const body = JSON.stringify({
      data: {
        attributes: { utterance },
        type: 'prediction',
      },
    });
    console.log(76)

    return apiRequest('post', headers, url, body);
  },
};

const apiRequest = (method, headers, url, body) => {
  const options = { headers, url };
  if (body) {
    options.body = body;
  }

  return new Promise((resolve, reject) => {
    request[method](options, (err, httpResponse, resBody) => {
      // console.log(90,options, method, httpResponse, resBody)
      // console.log(err)

      if (err) {
        reject(err);
      }

      resolve(resBody);
    });
  });
}
