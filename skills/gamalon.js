require('node-env-file');

const gamalonMiddleware = require('../gamalonMiddleware')({
  accessToken: process.env.ACCESS_TOKEN,
  treeId: process.env.TREE_ID,
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
  });
};
