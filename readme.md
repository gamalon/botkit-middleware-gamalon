# Gamalon Botkit Middleware

This middleware plugin for [Botkit](https://botkit.ai) allows developers to easily integrate [Gamalon's](https://gamalon.com/) classification service.

## Quick Start

1. Run `npm install`.
2. Get your `CLIENT_ID`, `CLIENT_SECRET` and `TREE_ID` from Gamalon.
3. Create a `.env` file that should look as follows:
  ```
  CLIENT_ID=<your Gamalon client id>

  CLIENT_SECRET=<your Gamalon client secret>

  TREE_ID=<your Gamalon tree id>
  ```
4. Run `node .`
5. Navigate to `localhost:3000` to see the chatbot. It will spit out the classification results of any message you type.

## API

`skills/gamalon.js` contains an example of how you might use the middleware.

* First you'll want to instantiate the middleware, passing in the client id, client secret, and tree id. This will tell the middleware which tree should be used for classification.

```js
const gamalonMiddleware = require('../gamalonMiddleware')({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  treeId: process.env.TREE_ID,
});
```

* Once you've created the middleware, you can to use it. Gamalon's middleware can be used at any step of the incoming messages pipeline: `ingest`, `normalize`, `categorize`, `receive`. Below is an example of adding it to the `receive` step.

```js
controller.middleware.receive.use(gamalonMiddleware);
```

* The middleware classifies the text from the `message` and adds the results to `message.gamalon`. It has the following fields:
  * `error` - A string that describes the error. If it is truthy, then an error has occurred and you should have your bot respond appropriately. Otherwise the classification results can be used.
  * `intent` - The name of the intent with the highest probability.
  * `confidence` - The confidence of the classification.
  * `path` - The path is the tree that leads to the intent.

```js
controller.on('message_received', function(bot, message) {
  const { error, intent, confidence, path } = message.gamalon;

  //...
});
```

### Multi-Intent

In order to use multi-intent classification, pass boolean `multiIntent` into the middleware initialization config object. The results will instead be in a field called `intents`. Each object in the array represents an intent and has `intent`, `confidence`, `path` fields.

```js
controller.on('message_received', function(bot, message) {
  const { error, intents } = message.gamalon;

  intents.forEach((data) => {
    const { intent, confidence, path } = data;
    //...
  });
});
```

## Tests

To run test use `npm test`. You must have your client id, client secret, and tree id in the
`.env` file.

## Using the middleware

* Copy the `gamalonMiddleware` directory into your project.
* Run `npm install --save request`
