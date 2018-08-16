const assert = require('assert');
const env = require('node-env-file');
env(__dirname + '/../.env');

const API = require('../gamalonMiddleware/api');
const { wordListAdapter, exportCleanUp } = require('../gamalonMiddleware/utils');

const { ACCESS_TOKEN, TREE_ID } = process.env;

describe('fetchTree', function() {
  it('should be structured properly', function(done) {
    API.fetchTree(ACCESS_TOKEN, TREE_ID)
      .then((body) => {
        let project = JSON.parse(body);
        assert.equal(!!project.tree, true);
        assert.equal(!!project.tree.tree, true);
        done();
      });
  });
});

describe('trainModel', function() {
  it('should return a training id', function(done) {
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

describe('classifyUtterance', function() {
  it('should return a domains field', function(done) {
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
