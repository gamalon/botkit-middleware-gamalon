var gamalonMiddleware = require('../gamalonMiddleware.js')({
  username: process.env.USERNAME || "test@testgamalon.com",
  password: process.env.USERNAME || "testgamalon1",
  client_secret: process.env.CLIENT_SECRET || "Wa8w0HikGnMXcYRayObRzzRE8Rsj87ZbNe_IDYlf0ijgILfLBuNMS4k95dMfgxJ4",
  client_id: process.env.CLIENT_ID || '6k6MjBzkLLOwUmfMy0NhPdiWGgyW9BpO',
  treeId: process.env.TREE_ID || "3e91cb50-9ca1-11e8-8889-936563654ffa",
  lionessENDPOINT: process.env.lionessENDPOINT || 'http://localhost:5000/lioness',
  burrowENDPOINT: process.env.burrowENDPOINT || 'http://localhost:4000/burrow',
});

module.exports = function(controller) {
  controller.middleware.receive.use(gamalonMiddleware);

  controller.on('message_received', function(bot, message) {
    const { error, intent, probability, path } = message.gamalon;
    console.log(message)
    if (error) {
      bot.reply(message, `Error: ${error}`);
      return
    }

    bot.reply(message, intent);
    bot.reply(message, `${probability}`);
    bot.reply(message, JSON.stringify(path));
  });
};
