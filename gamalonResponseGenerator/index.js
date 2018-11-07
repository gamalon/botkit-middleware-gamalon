let context = {
  intents: [],
};

const resetContext = () => {
  context = {
    intents: [],
  };
};

const stripSuffix = (str) => {
  return str.substr(0, str.indexOf('_'));
}

const safePush = (arr, newInt) => {
  arr.indexOf(newInt) === -1 ? arr.push(newInt) : console.log('already in intents')
}

const responseToClarification = (message, reply) => {
  if (reply.blocked) {
    return;
  }

  console.log(16, message.text)
  console.log(16, context.possibleResponses)

  if (context.waitingForClarification) {
    if (context.possibleResponses.map(x=>stripSuffix(x)).includes(message.text.trim().toLowerCase())) {
      safePush(context.intents, message.text.trim().toLowerCase());
      reply.blocked = false;
      console.log(context.intents)
      reply.steps = [{ prompt: `Thank you. So you want to ${context.intents.join(' ')}`}];
      resetContext();
    } else {
      console.log(26, context.possibleResponses)
      reply.blocked = true;
      reply.steps = [
        { prompt: `I don't understand. Please clarify.` },
        { prompt: `${context.possibleResponses.map(x=>stripSuffix(x)).join(' or ')}` },
      ];
    }
  }
}

const clarify = (message, reply) => {
  if (reply.blocked) {
    return;
  }

  const { marginals } = message.gamalon;
  const intentParentCategories = {};

  marginals.intents.forEach(({ intent, confidence, path }) => {
    if (!intentParentCategories[intent]) {
      intentParentCategories[intent] = [];
    }

    for (let i = path.length - 1; i >= 0; i -= 1) {
      const pathStep = path[i];
      if (pathStep !== intent) {
        intentParentCategories[intent].push(pathStep);
        break;
      }
    }


    let classification;

    for (let intent in intentParentCategories) {
      if (intentParentCategories[intent].length > 1) {
        classification = {
          intent: intent,
          parentCategories: intentParentCategories[intent],
        }
        break;
      }
    }

    if (classification) {
      const step1 = ({ intent }) => ({
        prompt: `I see that you want to ${intent}`
      });
      const step2 = ({ parentCategories }) => ({
        prompt: `Please help us clarify: ${parentCategories.map(x=>stripSuffix(x)).join(' or ')}`,
      });

      reply.blocked = true;
      reply.steps = [step1, step2].map((step) => step(classification));

      safePush(context.intents, classification.intent);
      context.waitingForClarification = true;
      context.possibleResponses = classification.parentCategories;
    }
  });
}

const responseToCancelPrevention = (message, reply) => {
  if (reply.blocked) {
    return;
  }

  const { gamalon } = message;

  if (context.waitingForCancelResponse) {
    if (message.text === 'no') {
      reply.steps = [
        { prompt: 'Okay, we are sorry to see you go.' },
      ];
      resetContext();
    } else if (message.text === 'yes') {
      reply.steps = [
        { prompt: 'Well call you soon' },
      ];
      resetContext();
    } else {
      reply.steps = [
        { prompt: 'I don\'t understand. Can we call you. Yes or no?' },
      ];
    }
  }
};

const preventCancel = (message, reply) => {
  if (reply.blocked) {
    return;
  }

  const { gamalon } = message;
  const allPaths = gamalon.subtree.intents.reduce((acc, { intent }) => acc.concat([intent]), []);

  console.log(131, allPaths, context.intents)
  if (allPaths.includes('cancel') || context.intents.includes('cancel')) {
    const cancelIndex = allPaths.findIndex((word) => word === 'cancel');
    const cancelIntent = allPaths[cancelIndex - 1] || allPaths[cancelIndex + 1];

    context.intents.push(cancelIntent);

    reply.blocked = true;
    reply.steps = [
      { prompt: `Before you cancel your ${cancelIntent} account, can we call you to see what the issue was` },
      { prompt: `Yes or no?` },
    ];

    context.waitingForCancelResponse = true;
  }
}

const executeReply = (bot, message, reply) => {
  console.log(reply)
  reply.steps.forEach((step) => {
    bot.reply(message, step.prompt);
  });
};


const multi_int = (bot, message, reply) => {
  console.log(143, 'inpath')
  const  { gamalon } = message
  console.log(144, gamalon.subtree.intents)
  gamalon.subtree.intents.forEach((data, i) => {
    console.log(147, data.path)
  intnet = data.intent ? data.intent : 'UNKNOWN'
  var resp = []


  // console.log(path)
  for (x of data.path){
    console.log(168, x)
    // console.log(97, x)
    if (dict[x]){
      console.log('matched', x, dict[x])
      pick=dict[x][Math.floor(Math.random() * dict[x].length)]
      console.log('pick', pick)
      resp=resp.concat(pick)
    }
  }
      knownResp = resp.join(' and specifically about')// dict[intent]
      console.log('knownResp',knownResp)
      // knownResp

})
  bot.reply(message, knownResp)
}

module.exports = (bot, message) => {
  const reply = { steps: [] };
  const qa = false // execute q&a if true, multi intent if false
  if (qa) {
  //rules
  responseToCancelPrevention(message, reply);
  responseToClarification(message, reply);
  preventCancel(message, reply);
  clarify(message, reply);
  executeReply(bot, message, reply);
}
  else {
    multi_int(bot, message, reply)
    // reply
  }
};


dict = { // note don't use empty arrays!!!
'UNKNOWN': ["sorry I didn't catch that.", "say again?", "can you speak more slowly please."],
'unknown': ["sorry I didn't catch that.", "say again?", "can you speak more slowly please."],
'activate': ['activating'],
'debit': ['I see you have a debit card question'],
'credit': ['I see you have a credit card question'],
'cancel': ['we are sorry to see you go.'],
'fraud': ['potential fraud']
}
