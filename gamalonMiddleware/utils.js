const STRIPPED_WORDLIST_TYPES = ['present', 'absent'];

const notUtilityNode = (name) => (
  !(name.endsWith('_node') || name.endsWith('_wl'))
);

const notUtilityPath = (path) => (
  !path.some(key => key.endsWith('_node'))
);

const isSubarray = (subarray, array) => {
  for (var i = 0; i < subarray.length; i++) {
    let element = subarray[i];
    if (element !== array[i]) {
      return false;
    }
  }
  return true;
};

const pathIsUnaccountedFor = (path, sortedIntents) => (
    sortedIntents.every(sortedIntent => (
      !isSubarray(path, sortedIntent.path)
    ))
);

const consolidatePaths = (intents) => {
  const sortedIntents = intents.sort((a, b) => (
    a.path.length < b.path.length ? -1 : 1
  ));
  return sortedIntents.filter((intent, i) => (
    pathIsUnaccountedFor(intent.path, sortedIntents.slice(i + 1))
  ));
};

const addProbabilities = (intents, domains) => {
  intents.forEach((intent) => {
    const path = intent.path;
    const rootKey = path[1];
    let currentSlot = domains[rootKey];
    let currentProbability = currentSlot.probability;

    for (let i = 2; i < path.length; i++) {
      const nextKey = path[i];
      currentSlot = currentSlot.children[nextKey];
      currentProbability *= currentSlot.probability;
    }

    intent.confidence = currentProbability;
  });
};

const selectMultiIntents = (mostLikelySubtree, domains) => {
  let intents = [];
  Object.keys(mostLikelySubtree).forEach(key => {
    _selectMultiIntents(mostLikelySubtree[key], key, intents, []);
  });
  intents = consolidatePaths(intents);
  addProbabilities(intents, domains);
  return { intents };
};

const _selectMultiIntents = (mostLikelySubtree, currentIntent, intents, pathSoFar) => {
  const subtreeKeys = Object.keys(mostLikelySubtree);
  const path = pathSoFar.concat([currentIntent]);
  const intent = { intent: currentIntent, path };

  if (subtreeKeys.length === 0) {
    intents.push(intent);
    return;
  }

  subtreeKeys.forEach((key) => {
    if (notUtilityNode(key)) {
      _selectMultiIntents(mostLikelySubtree[key], key, intents, path);
    } else {
      intents.push(intent);
    }
  });
};

const selectSlot = (domains) => {
  let best = { intent: null, confidence: -Infinity, path: null };
  Object.keys(domains).forEach(key => {
    if (domains[key].children) {
      _selectSlot(domains[key].children, domains[key].probability, best, [key]);
    }
  });
  return best;
};

const _selectSlot = (obj, prevPathProbability, best, pathSoFar, parentKey) => {
  Object.keys(obj).forEach(key => {
    let pathProbability;
    let rootKey;

    if (key === 'unknown_wl' && !obj[key].probability) {
      pathProbability = prevPathProbability;
    } else {
      pathProbability = obj[key].probability * prevPathProbability;
    }

    if (notUtilityNode(key)) {
      rootKey = key;
    } else {
      rootKey = parentKey;
    }

    const path = pathSoFar.concat([key]);

    if (obj[key].children) {
      _selectSlot(obj[key].children, pathProbability, best, path, rootKey);
    } else if (pathProbability > best.confidence && notUtilityPath(path)) {
      best.confidence = pathProbability;
      best.path = path;
      best.intent = rootKey;
    }
  });
};

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

const exportCleanUp = (obj) => {
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
    exportCleanUp(child)
  ));

  return copy;
};


module.exports = {
  wordListAdapter,
  exportCleanUp,
  selectSlot,
  notUtilityNode,
  selectMultiIntents,
};
