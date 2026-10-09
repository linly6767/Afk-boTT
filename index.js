const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot Online!'));
app.listen(process.env.PORT || 3000);

function createBot() {
  const bot = mineflayer.createBot({
    host: process.env.SERVER_IP,
    port: parseInt(process.env.SERVER_PORT) || 25565,
    username: process.env.BOT_NAME || 'AFK_Bot_24H'
  });
  bot.on('spawn', () => console.log('Bot is in server!'));
  bot.on('end', () => setTimeout(createBot, 15000));
  bot.on('error', err => console.log('Error:', err));
}
createBot();

