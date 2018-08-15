const request = require('request');

const lionessENDPOINT = 'https://app.gamalon.com/lioness';
const burrowENDPOINT = 'https://app.gamalon.com/burrow';

module.exports = {
  fetchTree: (accessToken, treeId) => {
    const url = `${burrowENDPOINT}/idea-tree/${treeId}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };

    return apiRequest('get', headers, url);
  },

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

      if (err) {
        reject(err);
      }

      resolve(resBody);
    });
  });
}
