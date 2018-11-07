let context = {
  intents: [],
};

let multiResp = false

const resetContext = () => {
  context = {
    intents: [],
  };
};

let global_message

const stripSuffix = (str) => {
  return str.substr(0, str.indexOf('_'));
}

const safePush = (arr, newInt) => {
  arr.indexOf(newInt) === -1 ? arr.push(newInt) : console.log('already in intents')
}


const clarify = (bot, message, reply) => {
  if (reply.blocked) {
    return;
  }

  const { marginals } = message.gamalon;
  const intentParentCategories = {};

  // console.log(53, marginals.intents, marginals.intents.map(x=>x.path))
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
    // console.log(69, intentParentCategories)
    for (let intent in intentParentCategories) {
      if (intentParentCategories[intent].length > 1) {
        classification = {
          intent: intent,
          parentCategories: intentParentCategories[intent],
        }
        break;
      }
    }
    // console.log(79, classification)
    if (classification) {
      const step1 = ({ intent }) => ({
        prompt: `I see that you have a question about ${intent}`
      });
      const step2 = ({ parentCategories }) => ({
        prompt: `Please help us clarify: ${parentCategories.map(x=>stripSuffix(x)).join(' or ')}`,
      });

      reply.blocked = true;
      console.log(92, 'set to true')
      multiResp=true
      reply.steps = [step1, step2].map((step) => step(classification));

      safePush(context.intents, classification.intent);
      context.waitingForClarification = true;
      context.possibleResponses = classification.parentCategories;
    }else{
      multiResp=false
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
      multiResp = true
      console.log(130, 'set to true')

      resetContext();
    } else if (message.text === 'yes') {
      reply.steps = [
        { prompt: 'Well call you soon' },
      ];
      multiResp = true
      console.log(130, 'set to true')
      resetContext();
    } else {
      reply.steps = [
        { prompt: 'I don\'t understand. Can we call you. Yes or no?' },
      ];
      multiResp = true
      console.log(130, 'set to true')
    }
    global_message = false
  }
};

const preventCancel = (message, reply) => {
  if (reply.blocked) {
    return;
  }

  const { gamalon } = message;
  const allPaths = gamalon.marginals.intents.reduce((acc, { intent }) => acc.concat([intent]), []);

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
    global_message = false

    context.waitingForCancelResponse = true;
  }
}

const responseToClarification = (message, reply) => {
  if (reply.blocked) {
    return;
  }
  console.log(24, 'multiresp', multiResp)

  // console.log(16, message.text)
  // console.log(17, context.possibleResponses)

  if (context.waitingForClarification) {
    if (context.possibleResponses.map(x=>stripSuffix(x)).includes(message.text.trim().toLowerCase())) {
      safePush(context.intents, message.text.trim().toLowerCase());
      reply.blocked = false;
      // console.log(35, context.intents)
      reply.steps = [{ prompt: `Thank you. I can help you with ${context.intents.join(' ')}`}];
      global_message = false
      resetContext();
    } else {
      // console.log(26, context.possibleResponses)
      reply.blocked = true;
      reply.steps = [
        { prompt: `I don't understand. Please clarify.` },
        { prompt: `${context.possibleResponses.map(x=>stripSuffix(x)).join(' or ')}` },
      ];
      global_message = false

    }
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
  if (message) {
  const  { gamalon } = message
  // console.log(144, gamalon.marginals.intents)
  gamalon.subtree.intents.forEach((data, i) => {
    // console.log(147, data.path)
  intnet = data.intent ? data.intent : 'UNKNOWN'
  var resp = []


  // console.log(path)
  for (x of data.path){
    // console.log(168, x)
    // console.log(97, x)
    if (dict[x]){
      console.log('matched', x, dict[x])
      pick=dict[x][Math.floor(Math.random() * dict[x].length)]
      console.log('pick', pick)
      resp=resp.concat(pick)
    }
  }
      knownResp = resp.join(' and specifically ')// dict[intent]
      console.log('knownResp',knownResp)
      // knownResp

})
  bot.reply(message, knownResp)
}
}

module.exports = (bot, message) => {
  // if (!context.blocked) {
  //   console.log(193, 'reset multi_int')
  // }
  message.gamalon.marginals.intents = message.gamalon.marginals.intents.filter(x=>x.confidence>0.4)
  global_message=message


  const reply = { steps: [] };
  const qa = true // execute q&a if true, multi intent if false
  if (qa) {
  //rules
  console.log(190, message.gamalon.marginals.intents)
  preventCancel(message, reply);
  responseToCancelPrevention(message, reply);
  responseToClarification(message, reply);
  clarify(bot, message, reply);
  executeReply(bot, message, reply);
}

console.log(215,  multiResp )
if (!multiResp){
  console.log(217)
  multi_int(bot, global_message, reply)
  multiResp = false
}

};


dict = { // note don't use empty arrays!!!
'UNKNOWN': ["sorry I didn't catch that.", "say again?", "can you speak more slowly please."],
'unknown': ["sorry I didn't catch that.", "say again?", "can you speak more slowly please."],
'activate': ['activating.'],
'debit': ['I see you have a debit card question'],
'credit': ['I see you have a credit card question'],
'cancel': ['we are sorry to see you go.'],
'fraud': ['potential fraud.'],
'rewards_wl1': ['rewards.'],
'customer_service_rep':	["thank you for the feedback in regards to our customer experience team."],
'bad behavior': ["we're sorry that the team member was rude."],
'PIN-number': ['You need a new pin.']
}
