const { Telegraf, Markup } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const URL = 'blob:https://28oxpwpfzuij19yhjhlo50m7olskracrx4jmrd0jw0dx99buk3-h845251650.scf.usercontent.goog/a8228994-109b-461c-9193-3c6b331eda5f';

bot.start((ctx) => ctx.reply('⚔️ Эльдория ждет!', Markup.keyboard([[Markup.button.webApp('🏰 ИГРАТЬ', URL)]]).resize()));
bot.on('message', (ctx) => ctx.reply('Нажми кнопку ниже, чтобы войти в игру:', Markup.keyboard([[Markup.button.webApp('🏰 ИГРАТЬ', URL)]]).resize()));

bot.launch();
console.log('Бот готов!');
