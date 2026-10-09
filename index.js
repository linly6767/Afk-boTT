const bedrock = require('bedrock-protocol');
const express = require('express');

// 1. สร้าง Web Server รองรับ Render และ UptimeRobot
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bedrock AFK Bot is running!');
});

app.listen(PORT, () => {
  console.log(`[Web Server] Listening on port ${PORT}`);
});

// 2. ฟังก์ชันหลักสำหรับสร้าง บอท Bedrock
let client = null;
let afkInterval = null;

function createBot() {
  console.log('[+] Connecting to Bedrock Server...');

  // ดึงค่าจาก Environment Variables หรือใช้ค่า Default
  const host = process.env.SERVER_IP || 'your_aternos_ip.aternos.me';
  const port = parseInt(process.env.SERVER_PORT) || 19132; // พอร์ต Bedrock ปกติคือ 19132
  const username = process.env.BOT_NAME || 'AFK_Bot_Bedrock';

  client = bedrock.createClient({
    host: host,
    port: port,
    username: username,
    offline: true, // หากเซิร์ฟเวอร์เปิด Online Mode (Xbox) ให้เปลี่ยนเป็น false
    skipPing: true
  });

  // เมื่อบอทเกิดในโลกเรียบร้อยแล้ว (Spawned)
  client.on('spawn', () => {
    console.log(`[+] บอท ${username} เข้าเซิร์ฟเวอร์และเกิดเรียบร้อยแล้ว!`);

    if (afkInterval) clearInterval(afkInterval);

    // ทำงานสุ่มแอ็กชันป้องกันระบบ Anti-AFK ทุกๆ 15-30 วินาที
    afkInterval = setInterval(() => {
      if (!client) return;

      try {
        const rand = Math.random();

        if (rand < 0.4) {
          // 1. สุ่มหันหน้าไปทิศทางต่างๆ (Look around)
          const randomYaw = Math.floor(Math.random() * 360) - 180;
          const randomPitch = Math.floor(Math.random() * 180) - 90;

          client.queue('player_auth_input', {
            pitch: randomPitch,
            yaw: randomYaw,
            position: { x: 0, y: 0, z: 0 },
            move_vector: { x: 0, z: 0 },
            head_yaw: randomYaw,
            input_data: 0n,
            input_mode: 'mouse',
            play_mode: 'normal',
            interaction_model: 'touch',
            tick: 0n,
            delta: { x: 0, y: 0, z: 0 }
          });
          console.log('[AFK Action] หันมองทิศทางใหม่');

        } else if (rand < 0.7) {
          // 2. ต่อยอากาศ / แกว่งแขน (Swing Arm)
          client.queue('animate', {
            action_id: 'swing_arm',
            runtime_entity_id: client.entityId || 1n
          });
          console.log('[AFK Action] แกว่งแขน/ต่อยอากาศ');

        } else {
          // 3. ย่อตัว (Sneak)
          client.queue('player_action', {
            runtime_entity_id: client.entityId || 1n,
            action: 'start_sneak',
            position: { x: 0, y: 0, z: 0 },
            result_position: { x: 0, y: 0, z: 0 },
            face: 0
          });

          setTimeout(() => {
            if (client) {
              client.queue('player_action', {
                runtime_entity_id: client.entityId || 1n,
                action: 'stop_sneak',
                position: { x: 0, y: 0, z: 0 },
                result_position: { x: 0, y: 0, z: 0 },
                face: 0
              });
            }
          }, 1200);
          console.log('[AFK Action] ย่อตัวแล้วลุกขึ้น');
        }
      } catch (err) {
        console.log('[!] AFK Action Error:', err.message);
      }
    }, 15000 + Math.random() * 15000);
  });

  // จัดการเมื่อบอทโดนเตะ หรือหลุดเชื่อมต่อ
  client.on('close', () => {
    console.log('[-] บอทหลุดการเชื่อมต่อ กำลังลองใหม่ใน 20 วินาที...');
    reconnect();
  });

  client.on('error', (err) => {
    console.log('[!] เกิดข้อผิดพลาด:', err.message || err);
  });
}

function reconnect() {
  if (afkInterval) clearInterval(afkInterval);
  if (client) {
    client.removeAllListeners();
    client = null;
  }
  setTimeout(createBot, 20000);
}

// เริ่มการทำงาน
createBot();
