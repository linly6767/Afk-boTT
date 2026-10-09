const bedrock = require('bedrock-protocol');
const express = require('express');

// 1. Web Server สำหรับให้ Render และ UptimeRobot ยิงเช็กสถานะ
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Ultra-Realistic Bedrock AFK Bot is Active!');
});

app.listen(PORT, () => {
  console.log(`[Web Server] Online on port ${PORT}`);
});

let client = null;
let reconnectTimeout = null;

// 2. ฟังก์ชันสร้างบอทเชื่อมต่อ Bedrock
function createBot() {
  console.log('[+] กำลังเชื่อมต่อไปยัง Bedrock Server...');

  client = bedrock.createClient({
    host: process.env.SERVER_IP || 'your-server.aternos.me',
    port: parseInt(process.env.SERVER_PORT) || 19132, // พอร์ต Bedrock ปกติคือ 19132
    username: process.env.BOT_NAME || 'AFK_Player_Pro',
    offline: true // หากใช้ระบบ ID เถื่อน/Offline Mode บน Aternos
  });

  client.on('spawn', () => {
    console.log(`[+] บอท ${client.username} เข้าสู่เกมสำเร็จ! เริ่มต้นจำลองพฤติกรรมคนเล่น...`);
    startHumanBehavior(client);
  });

  client.on('end', (reason) => {
    console.log(`[-] บอทหลุดจากการเชื่อมต่อ: ${reason}`);
    scheduleReconnect();
  });

  client.on('error', (err) => {
    console.error(`[!] เกิดข้อผิดพลาด: ${err.message}`);
  });
}

// 3. ระบบจำลองพฤติกรรมมนุษย์แบบสุ่ม (Anti-AFK)
function startHumanBehavior(botClient) {
  let yaw = 0;
  let pitch = 0;

  function loop() {
    if (!botClient) return;

    const rand = Math.random();

    // สุ่มเปลี่ยนองศาการมองแบบสุ่มนุ่มนวล
    yaw += (Math.random() - 0.5) * 30;
    pitch += (Math.random() - 0.5) * 15;

    // จำกัดไม่ให้หันคอหักเกินธรรมชาติ (-80 ถึง 80 องศา)
    if (pitch > 80) pitch = 80;
    if (pitch < -80) pitch = -80;

    try {
      // ส่งข้อมูล Input จำลองการขยับการมอง และสุ่มการย่อตัว/กระโดด
      botClient.queue('player_auth_input', {
        pitch: pitch,
        yaw: yaw,
        head_yaw: yaw,
        position: { x: 0, y: 0, z: 0 },
        move_vector: { x: (rand > 0.5 ? 0.05 : -0.05), z: (rand > 0.5 ? 0.05 : -0.05) },
        input_data: {
          ascend: false,
          descend: false,
          north_jump: rand > 0.85, // สุ่มกระโดดบางครั้ง
          sneak: rand > 0.65,      // สุ่มย่อตัว
          sprinting: false
        },
        input_mode: 'touch',
        play_mode: 'normal',
        interaction_model: 'touch'
      });
    } catch (e) {
      // ข้ามกรณีเซิร์ฟเวอร์ยังไม่พร้อมรับแพ็กเก็ต
    }

    // สุ่มเวลาทำแอคชันรอบถัดไป (สุ่มระหว่าง 15 วินาที ถึง 1.5 นาที เพื่อไม่ให้ระบบจับจังหวะได้)
    const nextDelay = Math.floor(Math.random() * 75000) + 15000;
    setTimeout(loop, nextDelay);
  }

  loop();
}

// 4. ระบบ Reconnect สุ่มเวลา
function scheduleReconnect() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  const delay = Math.floor(Math.random() * 60000) + 30000; // สุ่มรอ 30-90 วินาที
  console.log(`[!] จะลองเชื่อมต่อใหม่อีกครั้งในอีก ${Math.round(delay / 1000)} วินาที...`);
  reconnectTimeout = setTimeout(createBot, delay);
}

createBot();
