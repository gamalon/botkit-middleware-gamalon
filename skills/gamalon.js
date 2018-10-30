require('node-env-file');

const gamalonMiddleware = require('../gamalonMiddleware')({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  treeId: process.env.TREE_ID,
  multiIntent: true,
});

const gamalonResponseGenerator = require('../gamalonResponseGenerator');

module.exports = function(controller) {
  controller.middleware.receive.use(gamalonMiddleware);

  controller.on('message_received', function(bot, message) {
    // const { error, intent, confidence, path } = message.gamalon;
    //
    // if (error) {
    //   bot.reply(message, `Error: ${error}`);
    //   return
    // }
    //
    // bot.reply(message, intent);
    // bot.reply(message, `${confidence}`);
    // bot.reply(message, JSON.stringify(path));

    /* For multi-intent, comment out above code and comment in the code below */

    const { error, intents } = message.gamalon;

    if (error) {
      bot.reply(message, `Error: ${error}`);
      return
    }

    gamalonResponseGenerator(bot, message);

    // intents.forEach(({ intent, confidence, path }) => {
    //   bot.reply(message, intent);
    //   bot.reply(message, `${confidence}`);
    //   bot.reply(message, JSON.stringify(path));
    // });
  });
};
