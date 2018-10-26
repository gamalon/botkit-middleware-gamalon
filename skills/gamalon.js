require('node-env-file');

const gamalonMiddleware = require('../gamalonMiddleware')({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  treeId: process.env.TREE_ID,
  multiIntent: true, //@bryan, comment out this line for multi-intnet
});

dict = { // note don't use empty arrays!!!
'UNKNOWN': ["sorry I didn't catch that.", "say again?", "can you speak more slowly please.", ''],
'hello': ["Hello, how can I help you today?"],
'goodbye': ["Thank you.  Goodbye.", "See you later", "Tchau"],
'coverage':	["i understand you had a question about coverage"],
'medical':	["here is a link to an FAQ about medical coverage"],
'dental':	["here is a link to an FAQ about dental coverage"],
'vision':	["here is a link to an FAQ about vision coverage"],
'dependent_care':	["here is a link to an FAQ about dependent care coverage"],
'prescription_drugs':	["here is a link to an FAQ about prescription drug coverage"],
'account':	["i understand you had a question about your account"],
	  'login':	["and specifically logging in"],
'spouse_access':	["and specifically spouse access"],
'activate':	["and specifically activation"],
'inquiry':	["and we appreciate the inquiry"],
'Close':	["and specifically about closing it"],
'transfer_request':	["and specifically a transfer request"],
'contribution':	["and specifically about contributions"],
'inadequate_funds_wl':	["and inadequate funds"],
'payroll':	["and specifically about payroll"],
'website':	["thank you for your feedback on our website"],
'understandable':	["we're happy to hear you found it easy to understand"],
'easy to navigate':	["we appreciate the positive feedback on the navigation"],
'good':	["it's always good to hear that our website team has delivered an experiece you are happy with"],
'informative':	["it's always good to hear our website is informative"],
'error':	["we're sorry you experienced this error"],
'crashed':	["we're sorry that the website crashed"],
'tool unavailable':	["we're sorry that you weren't able to find everything you were looking for"],
'hanging':	["we're sorry that the website was slow"],
'incomplete information':	["we're sorry that the information you were looking for was not there"],
'broken link':	["we're sorry about the broken link"],
'unclear':	["we're sorry that the website was unclear"],
'app':	["thank you for your feedback on our app"],
'inquiry':	["and for your inquiry"],
'crashed':	["we're sorry that the app crashed"],
'error':	["we're sorry that you experienced an app error"],
'customer_service':	["thank you for your feedback on our service"],
'no response':	["we're sorry that you did not recieve a response back"],
'long process':	["we're sorry that the process took so long"],
'bad connection':	["we're sorry that there was a bad connection"],
'inquiry':	["and we appreciate the inquiry"],
'customer_service_rep':	["thank you for the feedback in regards to our customer experience team"],
'agreeable':	["we're glad to hear that you had a pleasant experience"],
'prompt':	["we're happy to hear that the service was prompt"],
'helpful':	["we're happy to hear that the service was helpful"],
'empathetic':	["we're happy to hear that the team was empathetic"],
'incorrect information':	["we're sorry you recieved incorrect information"],
'foreigner':	["we're sorry that our representative had trouble communicating"],
'unclear':	["we're sorry that the representative was unclear"],
'problem unresolved':	["we're sorry that we were unable to resolve the problem"],
'unhelpful':	["we're sorry that our team member was not more helpful"],
'bad behavior':	["we're sorry that the team member was rude"],
'card':	["i understand that you're talking about your card", "yes, let me help you with your card"],
'frozen':	["and had a problem with a frozen card"],
'declined':	["and had a problem with a decline"],
'needs validation':	["and need it to be validated"],
'lost':	["we're sorry that it was lost"],
'deactivate':	["and need it to be deactivated"],
'forgot PIN':	["and have forgotten your pin number"],
'new PIN':	["and need a new pin number"],
'activate':	["and need it to be activated"],
'inquiry':	["and we appreciate the inquiry"],
'reimbursement': ["i understand that you're talking about a reimbursement"],
'claims':	["about claims"],
'receipt':	["reciept"],
'purchase':	["purchase"],
'forms':	["i understand you are talking about forms"],
'upload':	["and have a question about uploading"],
'download':	["and have a question about downloading"],
'inquiry':	["and we appreciate the inquiry"],
'enrollment':	["and have a question about enrollment"],
}



module.exports = function(controller) {
  controller.middleware.receive.use(gamalonMiddleware);

  controller.on('message_received', function(bot, message) {


/* code block for single intent

//     const { error, intent, confidence, path } = message.gamalon;
//
//     if (error) {
//       bot.reply(message, `Error: ${error}`);
//       return
//     }
//
//     bot.reply(message, intent);
//     bot.reply(message, `${confidence}`);
//     bot.reply(message, JSON.stringify(path));

*/




    /**
    * To use multiIntent, comment out the above code and uncomment the below code.
    */

    console.log(message.gamalon)

    const { error, intents } = message.gamalon;

    if (error) {
      bot.reply(message, `Error: ${error}`);
      return
    }




    intents.forEach((data, i) => {
      intnet = data.intent ? data.intent : 'UNKNOWN'
      var resp = []


      // console.log(path)
      for (x of data.path){
        // console.log(97, x)
        if (dict[x]){
          console.log('matched', x, dict[x])
          pick=dict[x][Math.floor(Math.random() * dict[x].length)]
          console.log('pick', pick)
          resp=resp.concat(pick)
        }
      }
          knownResp = resp.join('\n')// dict[intent]
          console.log(knownResp)
          // knownResp





      bot.reply(message, knownResp)
      bot.reply(message, '--------------------------------')
      bot.reply(message, `Intent ${i + 1}, ${intnet}`);
      // bot.reply(message, `confidence: ${data.confidence}`);
      // bot.reply(message, JSON.stringify(data.path));

      /**
      * end for multi intent
      */


    });
  });
};
