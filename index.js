const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot Online!'));
app.listen(process.env.PORT || 3000);

function createBot() {
  const client = bedrock.createClient({
    host: process.env.SERVER_IP,
    port: parseInt(process.env.SERVER_PORT) || 19132,
    username: process.env.BOT_NAME || 'AFK_Bot_24H',
    offline: true
  });

  client.on('join', () => console.log('บอท Bedrock เข้าเซิร์ฟสำเร็จ!'));
  client.on('close', () => {
    console.log('หลุดการเชื่อมต่อ กำลังลองใหม่ใน 15 วินาที...');
    setTimeout(createBot, 15000);
  });
  client.on('error', err => console.log('Error:', err));
}

createBot();

