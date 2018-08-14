module.exports = function(controller) {
    if (process.env.studio_token) {
      controller.on('hello', function(bot, message) {
            // a new session with an unknown user has begun
            bot.reply(message, 'Please give me an utterance to classify');
      });

      controller.on('welcome_back', function(bot, message) {
          // a known user has started a new, fresh session
          bot.reply(message, 'Please give me an utterance to classify');
      });

      controller.studio.before('welcome_user', function(convo, next) {
          convo.setVar('bot', controller.studio_identity);
          next();
      });
    }
};
