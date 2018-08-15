var gamalonMiddleware = require('../gamalonMiddleware')({
  // username: process.env.USERNAME || "test@testgamalon.com",
  // password: process.env.USERNAME || "testgamalon1",
  // client_secret: process.env.CLIENT_SECRET || "Wa8w0HikGnMXcYRayObRzzRE8Rsj87ZbNe_IDYlf0ijgILfLBuNMS4k95dMfgxJ4",
  // client_id: process.env.CLIENT_ID || '6k6MjBzkLLOwUmfMy0NhPdiWGgyW9BpO',
  accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik1rUkZOa1pDUTBSRU16RTVPVVpDUXpjeFEwWkJOMEZDTUVVMU1rWkNRek15TURoR09Ua3pRUSJ9.eyJodHRwOi8vZ2FtYWxvbi5jb20vb3JnYW5pemF0aW9uX2lkIjoxLCJodHRwOi8vZ2FtYWxvbi5jb20vYXV0aG9yaXphdGlvbiI6eyJncm91cHMiOltdLCJyb2xlcyI6W10sInBlcm1pc3Npb25zIjpbXX0sImh0dHA6Ly9nYW1hbG9uLmNvbS9yZWFkX29ubHkiOmZhbHNlLCJpc3MiOiJodHRwczovL2dhbWFsb24uYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDViMTU1MDNmMTU3ODU5NzE2ZjJjMTJhNSIsImF1ZCI6WyJodHRwczovL2RlbW8uZ2FtYWxvbi5jb20vYXBpIiwiaHR0cHM6Ly9nYW1hbG9uLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE1MzQzMjcwMTcsImV4cCI6MTUzNDQxMzQxNywiYXpwIjoiNms2TWpCemtMTE93VW1mTXkwTmhQZGlXR2d5VzlCcE8iLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIGFkZHJlc3MgcGhvbmUgcXVlcnk6Y2xhc3NpZmllciBjcmVhdGU6Y2xhc3NpZmllciIsImd0eSI6InBhc3N3b3JkIn0.DWq1DEJoAhukZP-RfwdUUSYBgHvgMxLSLPZQbUV7cZ0T4Y6GZaiCUG2WDaUQwMEDdz_VOQlggd86euFxMi1r37CpbPmSNEtMb96Uzmai50ak2_WbCaLZsNRSCiGU1-4ljoMSElBZoGChULz6sOMVzgCLf4U4Xec9BlOGsSs4LjFhp1zn7le_xO__YGk9jiMj4tyKvUaj76rfPtV5XhHaid46Ywx74i-WjXf1sjazh_Cwmuwh0PL5qzSY_dQRcI8KODyMTqPniXEf0A53Nl5ZwIv0r03x1szHUGBOdC_PR8uzRKCRu_U4T52v6KqB0JhEm68We8hpnbujVB4PKNkcew",
  treeId: process.env.TREE_ID || "25503bb0-9b0f-11e8-9ae5-6d9d9656c947",
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
