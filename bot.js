const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const WEB_APP_URL = 'blob:https://0glwcbmz1853e0sxtlwo13etov0g39ho73uxkwj6bwezrrdm9z-h845251650.scf.usercontent.goog/d0b86cfe-a64b-4594-810c-8b57c503408d';

bot.start((ctx) => {
  return ctx.reply('⚔️ Добро пожаловать в Эльдорию!', 
    Markup.keyboard([
      Markup.button.webApp('ИГРАТЬ', WEB_APP_URL)
    ]).resize()
  );
});

bot.on('message', (ctx) => {
  ctx.reply('Твое приключение ждет в Mini App!', 
    Markup.keyboard([
      Markup.button.webApp('ОТКРЫТЬ ИГРУ', WEB_APP_URL)
    ]).resize()
  );
});

bot.launch();
console.log('Бот запущен!');
