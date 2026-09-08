/*
╭━━━〔 幻影 〕━━━⬣
┃『幻影〆 𝘼̷𝙣̷𝙞̷𝙢̷𝙚̷ 𝙈̷𝘿̷ 𝘽̷𝙤̷𝙩̷ ☠️』
┣━━━━━━━━⬣
┃『死神 • 𝔒𝔚𝔑𝔈ℜ : ℜ𝔄𝔖ℌℑ𝔇』
┃『黒龍 • 𝙏̷𝙮̷𝙥̷𝙚̷ : 𝘾̷𝙖̷𝙨̷𝙚̷』
┃『闇ノ • 𝙏̷𝙮̷𝙥̷𝙚̷ : 𝘽̷𝙪̷𝙩̷𝙩̷𝙤̷𝙣̷𝙨̷』
┃『零式 • 𝘾̷𝙧̷𝙚̷𝙙̷𝙞̷𝙩̷ : 𝘼̷𝙣̷𝙞̷𝙢̷𝙚̷𝘽̷𝙖̷𝙞̷𝙡̷𝙨̷』
┣━━━━━━━━⬣
┃『月読 • 𝘾̷𝙝̷𝙖̷𝙣̷𝙣̷𝙚̷𝙡̷』
┃ https://t.me/jamesBotz3
╰━━━〔 ☠️ 〕━━━⬣
*/
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const settings = require("./settings");
const { handleMessage } = require("./case");
const { buildWelcomeImage } = require("./helper/welcome");

const logger = pino({ level: "silent" });

// ── Random pick from array ──
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Ensure dirs ──
if (!fs.existsSync("./session")) fs.mkdirSync("./session", { recursive: true });
if (!fs.existsSync("./database")) fs.mkdirSync("./database", { recursive: true });

// ── Pairing number input ──
function askPairingNumber(label = "") {
  return new Promise((resolve) => {
    if (settings.pairingNumber && settings.pairingNumber.trim()) {
      return resolve(settings.pairingNumber.trim().replace(/\D/g, ""));
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(`\n📱 ${label || "Enter WhatsApp number (country code, no +)"}: `);
    rl.question("", (answer) => {
      rl.close();
      resolve(answer.trim().replace(/\D/g, ""));
    });
  });
}

// ─────────────────────────────────────────────
// startSession — boots one WA socket instance
// sessionId: string, sessionDir: string, number: string (optional override)
// ─────────────────────────────────────────────
async function startSession(sessionId, sessionDir, numberOverride = "") {
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
  });

  // ── Pairing ──
  if (!sock.authState.creds.registered) {
    const number = numberOverride || await askPairingNumber(`[${sessionId}] Enter WhatsApp number`);
    if (!number || number.length < 7) {
      console.error(`[${sessionId}] ❌ Invalid number. Skipping.`);
      return;
    }
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const code = await sock.requestPairingCode(number);
      const formatted = code.match(/.{1,4}/g).join("-");
      console.log(`\n[${sessionId}] ╔══════════════════════════════╗`);
      console.log(`[${sessionId}] ║  🔑 CODE: ${formatted.padEnd(15)}║`);
      console.log(`[${sessionId}] ╚══════════════════════════════╝\n`);
    } catch (err) {
      console.error(`[${sessionId}] ❌ Pairing error:`, err.message);
      return;
    }
  }

  // ── Connection ──
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "connecting") console.log(`[${sessionId}] 🟡 Connecting...`);

    if (connection === "open") {
      const name = sock.user?.name || "Unknown";
      const num = sock.user?.id?.split(":")[0];
      console.log(`[${sessionId}] ✅ Connected as ${name} (${num})`);
      console.log(`[${sessionId}] 🤖 Online | Prefix: ${settings.prefix} | Mode: ${settings.mode}`);

      // Update rent config active state if this is a rent session
      if (sessionId.startsWith("rent_")) {
        const configPath = `./database/${sessionId}.json`;
        if (fs.existsSync(configPath)) {
          const cfg = JSON.parse(fs.readFileSync(configPath, "utf-8"));
          cfg.active = true;
          fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
        }
      }
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log(`[${sessionId}] 🔴 Disconnected — Code: ${code}`);
      if (code !== DisconnectReason.loggedOut) {
        console.log(`[${sessionId}] 🔁 Reconnecting in 5s...`);
        setTimeout(() => startSession(sessionId, sessionDir, numberOverride), 5000);
      } else {
        console.log(`[${sessionId}] 🚪 Logged out. Delete session folder to re-pair.`);
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // ── Messages ──
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const m of messages) {
      if (!m.message) continue;
      const jid = m.key.remoteJid;
      const sender = m.key.fromMe ? sock.user.id : (m.key.participant || m.key.remoteJid);
      const senderNum = sender.replace(/:\d+/, "").split("@")[0];
      const isGroup = jid.endsWith("@g.us");
      const body =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption || "";
      console.log(`[${sessionId}][${isGroup ? "GRP" : "DM"}] ${senderNum}: ${body || "(media)"}`);
      if (m.key.fromMe) continue;
      await handleMessage(sock, m);
    }
  });

  // ── Group participant updates — join/left/promote/demote/kick ──
  sock.ev.on("group-participants.update", async ({ id: groupJid, participants, action, author }) => {
    try {
      const groupMeta = await sock.groupMetadata(groupJid).catch(() => ({}));
      const groupName = groupMeta.subject || "Group";
      const authorNum = author ? author.split("@")[0] : null;

      for (const userJid of participants) {
        const userNum = userJid.split("@")[0];
        const memberMeta = groupMeta.participants?.find(p => p.id === userJid);
        const userName = memberMeta?.name || memberMeta?.notify || userNum;
        console.log(`[${sessionId}][GROUP-EVENT] ${action.toUpperCase()} ${userNum} in ${groupName}${authorNum ? " by " + authorNum : ""}`);

        if (action === "promote") {
          await sock.sendMessage(groupJid, {
            text: `⭐ *Admin Promotion*

👤 @${userNum} has been *promoted to admin*
👮 By: @${authorNum || "admin"}
👥 Group: *${groupName}*`,
            mentions: [userJid, ...(author ? [author] : [])],
          });
          continue;
        }

        if (action === "demote") {
          await sock.sendMessage(groupJid, {
            text: `⬇️ *Admin Demotion*

👤 @${userNum} has been *removed as admin*
👮 By: @${authorNum || "admin"}
👥 Group: *${groupName}*`,
            mentions: [userJid, ...(author ? [author] : [])],
          });
          continue;
        }

        if (action === "remove") {
          const wasKicked = !!author && author !== userJid;
          if (wasKicked) {
            await sock.sendMessage(groupJid, {
              text: `👢 *Member Kicked*

👤 @${userNum} was *kicked* from the group
👮 By: @${authorNum}
👥 Group: *${groupName}*`,
              mentions: [userJid, ...(author ? [author] : [])],
            });
            continue;
          }
        }

        const isJoin = action === "add";
        const isLeave = action === "remove";
        if (!isJoin && !isLeave) continue;
        if (!settings.welcome.enabled) continue;

        let imgBuf;
        try {
          imgBuf = await buildWelcomeImage(sock, userJid, groupJid, isJoin ? "join" : "left", userName, groupName);
        } catch (imgErr) {
          console.error("[welcome] Image build failed:", imgErr.message);
          imgBuf = null;
        }

        const captionArr = isJoin ? settings.welcome.joinText : settings.welcome.leftText;
        const randomCaption = rand(captionArr);
        const caption = isJoin
          ? `${randomCaption}

Welcome @${userNum} to *${groupName}*! 🎉
We're glad to have you here.`
          : `${randomCaption}

Goodbye @${userNum} from *${groupName}* 👋`;

        if (imgBuf) {
          await sock.sendMessage(groupJid, {
            image: imgBuf, caption,
            mentions: [userJid],
            contextInfo: { mentionedJid: [userJid] },
          });
        } else {
          await sock.sendMessage(groupJid, { text: caption, mentions: [userJid] });
        }
      }
    } catch (err) {
      console.error("[group-event] Error:", err.message);
    }
  });

  return sock;
}

// ─────────────────────────────────────────────
// Boot — main session + all rent sessions
// ─────────────────────────────────────────────
async function boot() {
  console.log(`\n🌸 Starting ${settings.botName}...`);

  // Main session
  const mainDir = path.join(__dirname, "session", settings.sessionId);
  if (!fs.existsSync(mainDir)) fs.mkdirSync(mainDir, { recursive: true });
  await startSession(settings.sessionId, mainDir);

  // Rent sessions
  const rentDbPath = "./database/rentsessions.json";
  if (fs.existsSync(rentDbPath)) {
    const rentDB = JSON.parse(fs.readFileSync(rentDbPath, "utf-8"));
    for (const session of rentDB.sessions || []) {
      if (!fs.existsSync(session.sessionDir)) {
        fs.mkdirSync(session.sessionDir, { recursive: true });
      }
      console.log(`\n🔄 Loading rent session: ${session.number}`);
      // small delay between sessions to avoid rate limit
      await new Promise(r => setTimeout(r, 2000));
      await startSession(`rent_${session.number}`, session.sessionDir, session.number);
    }
  }
}

boot().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
