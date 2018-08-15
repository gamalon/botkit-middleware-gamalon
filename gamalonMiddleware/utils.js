const STRIPPED_WORDLIST_TYPES = ['present', 'absent'];

const notUtilityNode = (name) => (
  !(name.endsWith('-node') || name.endsWith('-wl'))
);
const selectSlot = (domains) => {
  let best = { intent: null, confidence: -Infinity, path: null };
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
    } else if (pathProbability > best.confidence && notUtilityNode(key)) {
      best.confidence = pathProbability;
      best.intent = key;
      best.path = path;
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


module.exports = {
  wordListAdapter,
  pawelExportCleanUp,
  selectSlot,
  notUtilityNode,
};
