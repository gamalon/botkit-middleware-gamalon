require('node-env-file');

const gamalonMiddleware = require('../gamalonMiddleware')({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  treeId: process.env.TREE_ID,
  // multiIntent: true,
});

module.exports = function(controller) {
  controller.middleware.receive.use(gamalonMiddleware);

  controller.on('message_received', function(bot, message) {
    const { error, intent, confidence, path } = message.gamalon;

    if (error) {
      bot.reply(message, `Error: ${error}`);
      return
    }

    bot.reply(message, intent);
    bot.reply(message, `${confidence}`);
    bot.reply(message, JSON.stringify(path));

    /**
    * To use multiIntent, comment out the above code and uncomment the below code.
    */
    // const { error, intents } = message.gamalon;
    //
    // if (error) {
    //   bot.reply(message, `Error: ${error}`);
    //   return
    // }
    //
    // intents.forEach((data, i) => {
    //   bot.reply(message, `Intent ${i + 1}`);
    //   bot.reply(message, data.intent);
    //   bot.reply(message, `${data.confidence}`);
    //   bot.reply(message, JSON.stringify(data.path));
    // });
  });
};
