let context = {
  intents: [],
};

const resetContext = () => {
  context = {
    intents: [],
  };
};

const responseToClarification = (message, reply) => {
  if (reply.blocked) {
    return;
  }

  if (context.waitingForClarification) {
    if (context.possibleResponses.includes(message.text.trim().toLowerCase())) {
      context.intents.push(message.text.trim().toLowerCase());
      reply.blocked = false;
      reply.steps = [{ prompt: `Thank you. So you want to ${context.intents.join(' ')}`}];
      resetContext();
    } else {
      reply.blocked = true;
      reply.steps = [
        { prompt: `I don't understand. Please clarify.` },
        { prompt: `${context.possibleResponses.join(' or ')}` },
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
        prompt: `Please help us clarify: ${parentCategories.join(', ')}`,
      });

      reply.blocked = true;
      reply.steps = [step1, step2].map((step) => step(classification));

      context.intents.push(classification.intent);
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
        { prompt: 'Fine! Didn\'t want you as a customer anyway' },
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
  const allPaths = gamalon.intents.reduce((acc, { intent }) => acc.concat([intent]), []);

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
  reply.steps.forEach((step) => {
    bot.reply(message, step.prompt);
  });
};

module.exports = (bot, message) => {
  const reply = { steps: [] };

  //rules
  responseToCancelPrevention(message, reply);
  responseToClarification(message, reply);
  clarify(message, reply);
  preventCancel(message, reply);

  // reply
  executeReply(bot, message, reply);
};
