const bedrock = require('bedrock-protocol');
const express = require('express');

// 1. ตั้งค่า Web Server สำหรับ Render / UptimeRobot กันบริการดับ
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('AFK Bot Bedrock Online 24/7!');
});

app.listen(PORT, () => {
  console.log(`[Web Server] ทำงานบนพอร์ต ${PORT}`);
});

// 2. ระบบบอท Minecraft Bedrock
let client = null;
let afkInterval = null;

function createBot() {
  const serverHost = process.env.SERVER_IP;
  const serverPort = parseInt(process.env.SERVER_PORT) || 19132;
  const botName = process.env.BOT_NAME || 'AFK_Bot_Pro';

  if (!serverHost) {
    console.error('[!] กรุณาตั้งค่า SERVER_IP ใน Environment Variables บน Render');
    return;
  }

  console.log(`[+] กำลังเชื่อมต่อไปยัง ${serverHost}:${serverPort} ในชื่อ ${botName}...`);

  try {
    client = bedrock.createClient({
      host: serverHost,
      port: serverPort,
      username: botName,
      offline: true,
      skipPing: true
    });
  } catch (err) {
    console.error('[!] ไม่สามารถสร้าง Client ได้:', err.message);
    cleanUpAndReconnect();
    return;
  }

  // เมื่อบอทเข้าเซิร์ฟเวอร์สำเร็จ
  client.on('join', () => {
    console.log(`[✔] บอท ${botName} เข้าสู่เซิร์ฟเวอร์ Bedrock เรียบร้อยแล้ว!`);

    if (afkInterval) clearInterval(afkInterval);

    // ระบบสุ่มขยับตัวป้องกันการตรวจจับ AFK
    afkInterval = setInterval(() => {
      if (!client) return;

      const randomYaw = Math.floor(Math.random() * 360) - 180;
      const randomPitch = Math.floor(Math.random() * 60) - 30;
      const doJump = Math.random() > 0.6;
      const doSneak = Math.random() > 0.75;

      try {
        // ส่ง Packet เคลื่อนไหวตามโปรโตคอล Bedrock
        client.queue('player_auth_input', {
          pitch: randomPitch,
          yaw: randomYaw,
          position: { x: 0, y: 0, z: 0 },
          move_vector: { x: 0, z: 0 },
          head_yaw: randomYaw,
          input_data: {
            start_jumping: doJump,
            sneaking: doSneak,
            want_up: doJump
          },
          input_mode: 'touch',
          play_mode: 'normal',
          interaction_model: 'touch'
        });

        console.log(`[AFK Motion] สุ่มหันหน้า (Yaw: ${randomYaw}, Pitch: ${randomPitch})${doJump ? ' + กระโดด' : ''}${doSneak ? ' + ย่อตัว' : ''}`);
      } catch (e) {
        console.error('[!] ส่ง Packet เคลื่อนไหวล้มเหลว:', e.message);
      }
    }, Math.floor(Math.random() * 10000) + 15000); // สุ่มเวลาทุก 15-25 วินาที
  });

  // จัดการเมื่อบอทหลุดการเชื่อมต่อ
  client.on('close', () => {
    console.log('[-] บอทหลุดการเชื่อมต่อ');
    cleanUpAndReconnect();
  });

  client.on('end', (reason) => {
    console.log(`[-] การเชื่อมต่อจบลง: ${reason}`);
    cleanUpAndReconnect();
  });

  client.on('error', (err) => {
    console.error('[!] เกิดข้อผิดพลาด:', err.message);
  });
}

function cleanUpAndReconnect() {
  if (afkInterval) {
    clearInterval(afkInterval);
    afkInterval = null;
  }
  client = null;

  const reconnectDelay = Math.floor(Math.random() * 10000) + 20000;
  console.log(`[...] จะพยายามเชื่อมต่อใหม่ในอีก ${Math.round(reconnectDelay / 1000)} วินาที...`);
  setTimeout(createBot, reconnectDelay);
}

createBot();
