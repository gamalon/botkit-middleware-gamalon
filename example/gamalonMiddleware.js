var request = require('request');

const STRIPPED_WORDLIST_TYPES = ['present', 'absent'];

const notUtilityNode = (name) => (
  !(name.endsWith('-node') || name.endsWith('-wl'))
);
const selectSlot = (domains) => {
  let best = { intent: null, probability: -Infinity, path: null };
  Object.keys(domains).forEach(key => {
    if (domains[key].children) {
      _selectSlot(domains[key].children, domains[key].probability, best, [key]);
    }
  });
  return best;
};

const _selectSlot = (obj, prevPathProbability, best, pathSoFar) => {
  Object.keys(obj).forEach(key => {
    const pathProbability = obj[key].probability * prevPathProbability;
    const path = pathSoFar.concat([key]);

    if (obj[key].children) {
      _selectSlot(obj[key].children, pathProbability, best, path);
    } else {
      if (pathProbability > best.probability && notUtilityNode(key)) {
        best.probability = pathProbability;
        best.intent = key;
        best.path = path;
      }
    }
  });
}
const wordListAdapter = (node) => {
  if (node.type && node.type.indexOf('WL-') === 0) {
    const children = node.children;

    node.type = node.type.slice(3);
    delete node.params;
    delete node.has_payload;
    delete node.fillerusage;
    delete node.params;
    node.children = children.map(n => n.name);
    return;
  }

  if (node.children) {
    node.children.forEach(child => wordListAdapter(child));
  }
};

const pawelExportCleanUp = (obj) => {
  if (typeof obj === 'string') {
    return obj;
  }

  const copy = { name: obj.name };
  if (obj.type) {
    copy.type = obj.type;
  }

  if (obj.linkId) {
    copy.linkId = obj.linkId;
  }

  if (obj.params) {
    copy.params = [...obj.params];
  }

  if (obj.fillerusage !== undefined) {
    copy.fillerusage = obj.fillerusage || null;
  }

  if (STRIPPED_WORDLIST_TYPES.indexOf(obj.type) === -1) {
    copy.params = copy.params || [];
    copy.fillerusage = copy.fillerusage || null;
  }

  const children = obj.children;

  copy.children = children && children.map(child => (
    pawelExportCleanUp(child)
  ));

  return copy;
};

var postData = JSON.stringify({
  username: "test@testgamalon.com",
  password: "testgamalon1",
  scope: 'openid',
  client_secret: "Wa8w0HikGnMXcYRayObRzzRE8Rsj87ZbNe_IDYlf0ijgILfLBuNMS4k95dMfgxJ4",
  audience: 'https://demo.gamalon.com/api',
  client_id: '6k6MjBzkLLOwUmfMy0NhPdiWGgyW9BpO',
  grant_type: 'password',
});

let lionessENDPOINT;
let burrowENDPOINT;
let accessToken;
let trainingId;
let tree;
let algorithm = 'revenum';

module.exports = function (config) {
  console.log(config);

  lionessENDPOINT = config.lionessENDPOINT;
  burrowENDPOINT = config.burrowENDPOINT;

  var postData = JSON.stringify({
    username: config.username,
    password: config.password,
    scope: 'openid',
    client_secret: config.client_secret,
    audience: 'https://demo.gamalon.com/api',
    client_id: config.client_id,
    grant_type: 'password',
  });

  request.post({
    headers: { 'Content-Type': 'application/json' },
    url: 'https://gamalon.auth0.com/oauth/token',
    body: postData,
  }, (err, httpResponse, body) => {
    accessToken = JSON.parse(body).access_token;

    request.get({
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      url: `${burrowENDPOINT}/idea-tree/${config.treeId}`,
    }, (err, httpResponse, body) => {
      tree = JSON.parse(body).tree.tree;
      wordListAdapter(tree);
      tree = pawelExportCleanUp(tree);

      request.post({
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        url: `${lionessENDPOINT}/classifiers?algorithm=${algorithm}`,
        body: JSON.stringify({
          data: {
            attributes: {
              tree,
            },
            type: 'classifier',
          },
        }),
      }, (err, httpResponse, body) => {
        trainingId = JSON.parse(body).data.id;
        console.log('Ready')
      });
    });
  });

  return (bot, message, next) => {
    if (accessToken && message.text) {
      request.post({
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        url: `${lionessENDPOINT}/classifiers/${trainingId}/prediction?algorithm=${algorithm}`,
        body: JSON.stringify({
          data: {
            attributes: {
              utterance: message.text,
            },
            type: 'prediction',
          },
        }),
      }, (err, httpResponse, body) => {
        console.log(body);
        const domains = JSON.parse(body).data.attributes.domains;
        message.gamalon = selectSlot(domains);
        console.log(message.gamalon);
        next();
      });
      return;
    }

    message.gamalon = { error: 'Not logged in yet' };
    next();
  };
}
