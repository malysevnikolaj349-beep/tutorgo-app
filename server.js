const express = require('express');
const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

function getCleanUrl() {
    let url = process.env.WEBAPP_URL || process.env.RENDER_EXTERNAL_URL || '';
    if (!url) return '';
    let clean = url.replace(/^blob:/, '').trim();
    if (!clean.startsWith('http')) clean = 'https://' + clean;
    try {
        const u = new URL(clean);
        return u.protocol + '//' + u.hostname;
    } catch (e) {
        return clean.split(':').slice(0, 2).join(':').replace(/\/$/, "");
    }
}

if (BOT_TOKEN) {
    const bot = new Telegraf(BOT_TOKEN);
    const finalUrl = getCleanUrl();
    bot.start((ctx) => {
        return ctx.reply(
            '⚔️ *Эльдория зовет, ' + ctx.from.first_name + '!*',
            {
                parse_mode: 'Markdown',
                ...Markup.keyboard([
                    [Markup.button.webApp('🏰 ВОЙТИ В ИГРУ', finalUrl)]
                ]).resize()
            }
        );
    });
    bot.launch();
    app.post('/api/notify', async (req, res) => {
        const { chatId, message } = req.body;
        try {
            await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
}

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log('Server running'));
