const assert = require('assert');
const env = require('node-env-file');
env(__dirname + '/../.env');

const API = require('../gamalonMiddleware/api');
const { wordListAdapter, exportCleanUp } = require('../gamalonMiddleware/utils');

const { CLIENT_ID, CLIENT_SECRET, TREE_ID } = process.env;

describe('fetchAccessToken', function() {
  it('should be structured properly', function(done) {
    API.fetchAccessToken(CLIENT_ID, CLIENT_SECRET)
      .then((body) => {
        let parsedBody = JSON.parse(body);
        assert.equal(!!parsedBody.access_token, true);
        assert.equal(!!parsedBody.expires_in, true);
        done();
      })
  });
});

describe('fetchTree', function() {
  it('should be structured properly', function(done) {
    API.fetchAccessToken(CLIENT_ID, CLIENT_SECRET).then((body) => {
      const ACCESS_TOKEN = JSON.parse(body).access_token;

      API.fetchTree(ACCESS_TOKEN, TREE_ID)
        .then((body) => {
          let project = JSON.parse(body);
          assert.equal(!!project.tree, true);
          assert.equal(!!project.tree.tree, true);
          done();
        });
    });
  });
});

describe('trainModel', function() {
  it('should return a training id', function(done) {
    API.fetchAccessToken(CLIENT_ID, CLIENT_SECRET).then((body) => {
      const ACCESS_TOKEN = JSON.parse(body).access_token;

      API.fetchTree(ACCESS_TOKEN, TREE_ID)
        .then((body) => {
          let tree = JSON.parse(body).tree.tree;
          wordListAdapter(tree);
          tree = exportCleanUp(tree);

          API.trainModel(ACCESS_TOKEN, tree, 'revenum')
            .then((body) => {
              let trainingId = JSON.parse(body).data.id;
              assert.equal(!!trainingId, true);
              done();
            });
        });
    });
  });
});

describe('classifyUtterance', function() {
  it('should return a domains field', function(done) {
    API.fetchAccessToken(CLIENT_ID, CLIENT_SECRET).then((body) => {
      const ACCESS_TOKEN = JSON.parse(body).access_token;

      API.fetchTree(ACCESS_TOKEN, TREE_ID)
        .then((body) => {
          let tree = JSON.parse(body).tree.tree;
          wordListAdapter(tree);
          tree = exportCleanUp(tree);

          API.trainModel(ACCESS_TOKEN, tree, 'revenum')
            .then((body) => {
              let trainingId = JSON.parse(body).data.id;

              API.classifyUtterance(ACCESS_TOKEN, trainingId, 'Test utterance', 'revenum')
                .then((body) => {
                  let domains = JSON.parse(body).data.attributes.domains;
                  assert.equal(!!domains, true);
                  done();
                });
            });
        });
    });
  });
});
