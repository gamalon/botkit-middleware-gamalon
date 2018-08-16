const assert = require('assert');
const {
  wordListAdapter,
  exportCleanUp,
  selectSlot,
  notUtilityNode,
} = require('../gamalonMiddleware/utils');

const node = child => ({
  name: 'node',
  children: child ? [child] : [],
  params: child ? [1] : [],
  type: 'node-type',
  fillerusage: null,
});

const nodeWithNonWordlistChild = child => ({
  ...node({ ...child, type: 'node-type' }),
});

const nodeWithPresentWLChild = child => ({
  ...node({ ...child, type: 'WL-present' }),
});

const nodeWithAbsentWLChild = child => ({
  ...node({ ...child, type: 'WL-absent' }),
});

describe('notUtilityNode', function() {
  it('should return true if name does not with "-node" or "-wl"', function() {
    const name1 = '';
    const name2 = 'node';
    const name3 = 'wl';
    const name4 = 'hypenated-word';
    assert.equal(notUtilityNode(name1), true);
    assert.equal(notUtilityNode(name2), true);
    assert.equal(notUtilityNode(name3), true);
    assert.equal(notUtilityNode(name4), true);
  });

  it('should return false if name ends with "-node"', function() {
    const name = 'util-node';
    assert.equal(notUtilityNode(name), false);
  });

  it('should return false if name ends with "-wl"', function() {
    const name = 'util-wl';
    assert.equal(notUtilityNode(name), false);
  });
});

describe('selectSlot', function() {
  it('should return the confidence and path of the most likely intent', function() {
    const domains = {
      Domain1: {
        children: {
          Domain11: {
            children: null,
            probability: 0.3,
          },
          Domain12: {
            children: null,
            probability: 1,
          },
        },
        probability: .2,
      },
      Domain2: {
        children: {
          Domain21: {
            children: null,
            probability: 0,
          },
          Domain22: {
            children: null,
            probability: 0.83,
          },
        },
        probability: 1,
      },
      Domain3: {
        children: {
          Domain21: {
            children: null,
            probability: 0,
          },
          Domain22: {
            children: null,
            probability: 0,
          },
        },
        probability: 0,
      },
    };
    const results = selectSlot(domains);
    assert.equal(results.confidence, .83);
    assert.equal(results.intent, "Domain22");
    assert.deepEqual(results.path, ["Domain2", "Domain22"]);
  });

  it('should not consider intents that are utility nodes (contain -node or -el suffix)', () => {
    const domains = {
      Domain1: {
        probability: 1,
        children: {
          'Domain11-node': {
            probability: 1,
            children: null
          }
        },
      },
      Domain2: {
        probability: 1,
        children: {
          'Domain21-wl': {
            probability: 1,
            children: null
          }
        }
      },
      Domain3: {
        probability: 0.1,
        children: {
          'Domain31': {
            probability: 0.1,
            children: null
          }
        }
      },
    };

    const results = selectSlot(domains);
    assert.equal(results.confidence, 0.1 * 0.1);
    assert.equal(results.intent, "Domain31");
    assert.deepEqual(results.path, ["Domain3", "Domain31"]);
  });
});

describe('wordListAdapter', () => {
  describe('WL-present', () => {
    const presentWLNode = nodeWithPresentWLChild(node());
    wordListAdapter(presentWLNode);

    it('should set the strip "WL" from type', () => {
      assert.equal(presentWLNode.children[0].type, 'present');
    });

    it('should remove "has_payload" attribute', () => {
      assert.equal(presentWLNode.children[0].has_payload, undefined);
    });

    it('should remove "params" attribute', () => {
      assert.equal(presentWLNode.children[0].params, undefined);
    });
  });

  describe('WL-absent', () => {
    const absentWLNode = nodeWithAbsentWLChild(node());
    wordListAdapter(absentWLNode);

    it('should set the strip "WL" from type', () => {
      assert.equal(absentWLNode.children[0].type, 'absent');
    });

    it('should remove "has_payload" attribute', () => {
      assert.equal(absentWLNode.children[0].has_payload, undefined);
    });

    it('should remove "params" attribute', () => {
      assert.equal(absentWLNode.children[0].params, undefined);
    });
  });

  describe('non-WL node', () => {
    const nonWLNode = nodeWithNonWordlistChild(node());
    wordListAdapter(nonWLNode);

    it('should set not change the type', () => {
      assert.equal(nonWLNode.children[0].type, 'node-type');
    });

    it('should not remove "params" attribute', () => {
      assert.equal(!!nonWLNode.children[0].params, true);
    });
  });
});

describe('exportCleanUp', () => {
  it('should return a copy', () => {
    const tree = nodeWithNonWordlistChild(nodeWithAbsentWLChild(node()));
    const exported = exportCleanUp(tree);
    assert.equal(exported === tree, false);
    assert.deepEqual(exported, tree);
  });

  it('should add params if missing', () => {
    const tree = node();
    delete tree.params;
    const exported = exportCleanUp(tree);
    assert.equal(tree.params, undefined);
    assert.deepEqual(exported.params, []);
  });

  it('should retain linkId', () => {
    const tree = { ...node(), linkId: 'my-test22' };
    const exported = exportCleanUp(tree);
    assert.equal(exported.linkId, tree.linkId);
  });

  it('should return a string if it receives a string as input', () => {
    const exported = exportCleanUp('cat');
    assert.equal(exported, 'cat');
  });
});
