const express = require('express');
const mineflayer = require('mineflayer');

// 1. Web Server สำหรับ Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Ultra-Realistic AFK Bot is Active!');
});

app.listen(PORT, () => {
  console.log(`[Web Server] Online on port ${PORT}`);
});

// 2. ฟังก์ชันหลักสร้างบอท
function createBot() {
  const bot = mineflayer.createBot({
    host: process.env.SERVER_IP,
    port: parseInt(process.env.SERVER_PORT) || 25565,
    username: process.env.BOT_NAME || 'AFK_Bot_Pro',
  });

  let mainLoopTimeout;

  // ฟังก์ชันหันหน้าแบบนุ่มนวล (Smooth Look) ลากเมาส์เหมือนคนจริง
  async function smoothLook(targetYaw, targetPitch, steps = 15) {
    if (!bot || !bot.entity) return;
    const currentYaw = bot.entity.yaw;
    const currentPitch = bot.entity.pitch;

    for (let i = 1; i <= steps; i++) {
      const yaw = currentYaw + (targetYaw - currentYaw) * (i / steps);
      const pitch = currentPitch + (targetPitch - currentPitch) * (i / steps);
      await bot.look(yaw, pitch, false);
      await new Promise(r => setTimeout(r, 20)); // หน่วงเวลาเล็กน้อยให้หมุนนุ่มนวล
    }
  }

  bot.on('spawn', () => {
    console.log(`[+] บอท ${bot.username} เข้าเกมสำเร็จ (โหมดจำลองพฤติกรรมมนุษย์)`);
    startHumanBehavior();
  });

  // 3. ระบบจำลองพฤติกรรมมนุษย์แบบผสมผสาน
  function startHumanBehavior() {
    async function loop() {
      if (!bot || !bot.entity) return;

      // สุ่มเลือกแอ็กชันแบบคนเล่นจริง
      const rand = Math.random();

      try {
        if (rand < 0.4) {
          // 40% - กวาดสายตามองรอบๆ แบบนุ่มนวล + สลับช่องไอเท็ม
          const newYaw = bot.entity.yaw + (Math.random() - 0.5) * 2;
          const newPitch = (Math.random() - 0.5) * 0.8;
          await smoothLook(newYaw, newPitch);

          // สุ่มเปลี่ยนช่อง Hotbar (0-8)
          const randomSlot = Math.floor(Math.random() * 9);
          bot.setQuickBarSlot(randomSlot);

        } else if (rand < 0.7) {
          // 30% - ย่อตัว หันมอง แล้วต่อยอากาศ 1 ที
          bot.setControlState('sneak', true);
          await smoothLook(bot.entity.yaw + 0.3, bot.entity.pitch);
          bot.swing('arm');
          await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
          bot.setControlState('sneak', false);

        } else if (rand < 0.9) {
          // 20% - เดินสั้นๆ พร้อมกระโดด 1 ครั้ง
          const dir = ['forward', 'back', 'left', 'right'][Math.floor(Math.random() * 4)];
          bot.setControlState(dir, true);
          if (Math.random() > 0.5) bot.setControlState('jump', true);

          await new Promise(r => setTimeout(r, 300 + Math.random() * 500));

          bot.setControlState(dir, false);
          bot.setControlState('jump', false);

        } else {
          // 10% - พักนิ่งๆ เหมือนคนพับจอไปทำอย่างอื่น (ไม่มีการขยับเลย)
          await new Promise(r => setTimeout(r, 5000));
        }
      } catch (err) {
        // ข้าม Error เล็กน้อยถ้าบอทกำลังโหลดฉาก
      }

      // สุ่มเวลารอระหว่าง 20 วินาที ถึง 2.5 นาที (จังหวะแบบมนุษย์จริง ไม่เป็นลูปซ้ำ)
      const nextDelay = Math.floor(Math.random() * 130000) + 20000;
      mainLoopTimeout = setTimeout(loop, nextDelay);
    }

    loop();
  }

  // 4. ระบบ Reconnect สุ่มเวลาหน่วง
  bot.on('end', (reason) => {
    console.log(`[-] บอทหลุด: ${reason}`);
    clearTimeout(mainLoopTimeout);

    // สุ่มรอ 1–3 นาที เพื่อไม่ให้ดูเป็นบอทตั้งโปรแกรม
    const delay = Math.floor(Math.random() * 120000) + 60000;
    console.log(`[!] จะลองเข้าใหม่ในอีก ${Math.round(delay / 1000)} วินาที...`);
    setTimeout(createBot, delay);
  });

  bot.on('error', (err) => console.error(`[!] Error: ${err.message}`));
}

createBot();
