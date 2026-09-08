/*
╭━━━〔 幻影 〕━━━⬣
┃『幻影〆 𝘼̷𝙣̷𝙞̷𝙢̷𝙚̷ 𝙈̷𝘿̷ 𝘽̷𝙤̷𝙩̷ ☠️』
┣━━━━━━━━⬣
┃『死神 • 𝙊̷𝙬̷𝙣̷𝙚̷𝙧̷ : 𝙅̷𝙖̷𝙢̷𝙚̷𝙨̷』
┃『黒龍 • 𝙏̷𝙮̷𝙥̷𝙚̷ : 𝘾̷𝙖̷𝙨̷𝙚̷』
┃『闇ノ • 𝙏̷𝙮̷𝙥̷𝙚̷ : 𝘽̷𝙪̷𝙩̷𝙩̷𝙤̷𝙣̷𝙨̷』
┃『零式 • 𝘾̷𝙧̷𝙚̷𝙙̷𝙞̷𝙩̷ : 𝘼̷𝙣̷𝙞̷𝙢̷𝙚̷𝘽̷𝙖̷𝙞̷𝙡̷𝙨̷』
┣━━━━━━━━⬣
┃『月読 • 𝘾̷𝙝̷𝙖̷𝙣̷𝙣̷𝙚̷𝙡̷』
┃ https://t.me/jamesBotz3
╰━━━〔 ☠️ 〕━━━⬣
*/
const fs = require("fs");
const path = require("path");
const settings = require("./settings");
const { Reply, sendInteractive, sendCarousel, React, typing } = require("./helper/func");
const { readJSON, isPremium, uptime, formatBytes } = require("./helper/utils");

// ── Rent sessions DB ──
const RENT_DB = "./database/rentsessions.json";
function getRentDB() {
  if (!fs.existsSync(RENT_DB)) fs.writeFileSync(RENT_DB, JSON.stringify({ sessions: [] }, null, 2));
  return JSON.parse(fs.readFileSync(RENT_DB, "utf-8"));
}
function saveRentDB(data) {
  fs.writeFileSync(RENT_DB, JSON.stringify(data, null, 2));
}

async function handleMessage(sock, m) {
  try {
    const jid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const senderNum = sender.replace(/:\d+/, "").split("@")[0];
    const botNumber = (sock.user?.id || "").split(":")[0].split("@")[0];
    const isGroup = jid.endsWith("@g.us");
    const isOwner = senderNum === settings.ownerNumber.replace(/\D/g, "");

    const premDB = readJSON("./database/premium.json") || { premiumUsers: [] };
    const userIsPremium = isPremium(sender, premDB);

    if (settings.mode === "self" && !isOwner && !userIsPremium) return;

    const body =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption || "";

    if (!body.startsWith(settings.prefix)) return;

    const args = body.slice(settings.prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();
    const text = args.join(" ");

    // ── Group metadata + admin verification (from your codebase) ──
    const groupMetadata = isGroup ? await sock.groupMetadata(jid).catch(() => ({})) : {};
    const groupName = groupMetadata.subject || "";
    const participants = isGroup ? (groupMetadata.participants || []).map(p => {
      let admin = null;
      if (p.admin === "superadmin") admin = "superadmin";
      else if (p.admin === "admin") admin = "admin";
      return { id: p.id || null, jid: p.jid || p.id || null, admin, full: p };
    }) : [];
    const groupAdmins = participants.filter(p => p.admin === "admin" || p.admin === "superadmin").map(p => p.jid || p.id);
    const isBotAdmin = isGroup ? groupAdmins.includes(botNumber + "@s.whatsapp.net") || groupAdmins.includes(botNumber) : false;
    const isAdmin = isGroup ? groupAdmins.includes(sender) : false;

    // ── Guards ──
    const needGroup = () => { if (!isGroup) { Reply(sock, jid, "❌ Group only command.", m); return true; } return false; };
    const needAdmin = () => { if (!isAdmin && !isOwner) { Reply(sock, jid, "❌ Admins only.", m); return true; } return false; };
    const needBotAdmin = () => { if (!isBotAdmin) { Reply(sock, jid, "❌ Add bot as group admin first.", m); return true; } return false; };

    console.log(`[CMD] ${senderNum} → .${command}${text ? " " + text : ""}`);
    await typing(sock, jid);

    switch (command) {

      // ═══════════════ MENU ═══════════════
      case "menu":
      case "help": {
        await sendCarousel(sock, jid, [
          {
            title: "⚡ GENERAL",
            body:
              `> ┏━━━━━━━━━━━━━━\n` +
              `> ┃༆ ping\n> ┃༆ info\n> ┃༆ owner\n> ┃༆ runtime\n` +
              `> ┗━━━━━━━━━━━━━━━─`,
            btnLabel: "📢 CHANNEL", btnUrl: settings.telegramChannel,
          },
          {
            title: "🛡️ TOOLS",
            body:
              `> ┏━━━━━━━━━━━━━━\n` +
              `> ┃༆ checkban\n> ┃༆ checkwa\n` +
              `> ┗━━━━━━━━━━━━━━━─`,
            btnLabel: "💬 GROUP", btnUrl: settings.telegramGroup,
          },
          {
            title: "👥 GROUP ADMIN",
            body:
              `> ┏━━━━━━━━━━━━━━\n` +
              `> ┃༆ open\n> ┃༆ close\n> ┃༆ link\n> ┃༆ promote\n` +
              `> ┃༆ demote\n> ┃༆ kick\n> ┃༆ setgname\n` +
              `> ┃༆ setdesc\n> ┃༆ setppgc\n` +
              `> ┗━━━━━━━━━━━━━━━─`,
            btnLabel: "💬 GROUP", btnUrl: settings.telegramGroup,
          },
          {
            title: "⚙️ BOT MODE",
            body:
              `> ┏━━━━━━━━━━━━━━\n` +
              `> ┃༆ public\n> ┃༆ self\n> ┃༆ rentbot\n> ┃༆ pair\n` +
              `> ┗━━━━━━━━━━━━━━━─`,
            btnLabel: "💬 GROUP", btnUrl: settings.telegramGroup,
          },
          {
            title: "👑 PREMIUM",
            body:
              `> ┏━━━━━━━━━━━━━━\n` +
              `> ┃༆ mypremium\n> ┃༆ buypremium\n` +
              `> ┗━━━━━━━━━━━━━━━─`,
            btnLabel: "💳 BUY", btnUrl: `https://wa.me/${settings.ownerNumber}`,
          },
        ], m);
        break;
      }

      // ═══════════════ GENERAL ═══════════════
      case "ping": {
        const start = Date.now();
        const ms = Date.now() - start;
        await sendInteractive(sock, jid, {
          header: "🏓 Pong!", title: "Bot Speed",
          body: `⚡ Response: *${ms}ms*\n✅ Bot is online`,
          footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
        }, m);
        break;
      }

      case "info": {
        const mem = process.memoryUsage();
        await sendInteractive(sock, jid, {
          header: `ℹ️ ${settings.botName}`, title: "Bot Information",
          body:
            `🤖 *Bot:* ${settings.botName}\n` +
            `👤 *Owner:* ${settings.ownerName}\n` +
            `⏱ *Uptime:* ${uptime()}\n` +
            `💾 *RAM:* ${formatBytes(mem.heapUsed)} / ${formatBytes(mem.heapTotal)}\n` +
            `🔧 *Node:* ${process.version}\n` +
            `📦 *Library:* AnimeBails`,
          footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
        }, m);
        break;
      }

      case "owner": {
        await sendInteractive(sock, jid, {
          header: "👑 Owner", title: settings.ownerName,
          body: `Contact the owner for support, keys, or custom bots.`,
          footer: settings.footerText, btnLabel: "💬 Chat Owner",
          btnUrl: `https://wa.me/${settings.ownerNumber}`,
        }, m);
        break;
      }

      case "runtime": {
        await sendInteractive(sock, jid, {
          header: "⏱ Runtime", title: "Bot Uptime",
          body: `🟢 Online for: *${uptime()}*`,
          footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
        }, m);
        break;
      }

      // ═══════════════ TOOLS ═══════════════
      case "checkban": {
        if (!text) return Reply(sock, jid, `Usage: ${settings.prefix}checkban <number>`, m);
        const numRaw = text.replace(/\D/g, "");
        await React(sock, m, "🔍");
        try {
          const [result] = await sock.onWhatsApp(numRaw + "@s.whatsapp.net");
          const exists = result?.exists === true;
          await sendInteractive(sock, jid, {
            header: "🛡️ Ban Checker",
            title: exists ? "✅ Not Banned" : "🚫 Banned / Not Found",
            body:
              `📱 *Number:* +${numRaw}\n\n` +
              `${exists ? "✅ *Status:* Active on WhatsApp\n🟢 Not banned" : "🚫 *Status:* BANNED or not on WhatsApp"}`,
            footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
          }, m);
        } catch (e) {
          console.error("[checkban]", e.message);
          await Reply(sock, jid, `❌ Error: ${e.message}`, m);
        }
        break;
      }

      case "checkwa": {
        if (!text) return Reply(sock, jid, `Usage: ${settings.prefix}checkwa <number>`, m);
        const numRaw = text.replace(/\D/g, "");
        await React(sock, m, "🔍");
        try {
          const [result] = await sock.onWhatsApp(numRaw + "@s.whatsapp.net");
          const exists = result?.exists === true;
          await sendInteractive(sock, jid, {
            header: "📱 WhatsApp Checker",
            title: exists ? "✅ On WhatsApp" : "❌ Not on WhatsApp",
            body:
              `📱 *Number:* +${numRaw}\n\n` +
              `${exists ? "✅ *Registered* on WhatsApp\n📲 Number is active" : "❌ *Not registered* on WhatsApp\n📵 Not found"}`,
            footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
          }, m);
        } catch (e) {
          console.error("[checkwa]", e.message);
          await Reply(sock, jid, `❌ Error: ${e.message}`, m);
        }
        break;
      }

      // ═══════════════ GROUP ADMIN ═══════════════

      case "open": {
        if (needGroup()) break;
        if (needAdmin()) break;
        if (needBotAdmin()) break;
        try {
          await sock.groupSettingUpdate(jid, "not_announcement");
          await React(sock, m, "🔓");
          await sendInteractive(sock, jid, {
            header: "🔓 Group Opened",
            title: groupName,
            body: `✅ Group is now *OPEN*\nAll members can send messages.`,
            footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
          }, m);
        } catch (e) {
          await Reply(sock, jid, `❌ Failed: ${e.message}`, m);
        }
        break;
      }

      case "close": {
        if (needGroup()) break;
        if (needAdmin()) break;
        if (needBotAdmin()) break;
        try {
          await sock.groupSettingUpdate(jid, "announcement");
          await React(sock, m, "🔒");
          await sendInteractive(sock, jid, {
            header: "🔒 Group Closed",
            title: groupName,
            body: `🔒 Group is now *CLOSED*\nOnly admins can send messages.`,
            footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
          }, m);
        } catch (e) {
          await Reply(sock, jid, `❌ Failed: ${e.message}`, m);
        }
        break;
      }

      case "link": {
        if (needGroup()) break;
        if (needAdmin()) break;
        if (needBotAdmin()) break;
        try {
          const code = await sock.groupInviteCode(jid);
          await sendInteractive(sock, jid, {
            header: "🔗 Group Link",
            title: groupName,
            body: `🔗 *Invite Link:*\nhttps://chat.whatsapp.com/${code}`,
            footer: settings.footerText,
            btnLabel: "🔗 Join Group",
            btnUrl: `https://chat.whatsapp.com/${code}`,
          }, m);
        } catch (e) {
          await Reply(sock, jid, `❌ Failed: ${e.message}`, m);
        }
        break;
      }

      case "promote": {
        if (needGroup()) break;
        if (needAdmin()) break;
        if (needBotAdmin()) break;
        // Target: mention or reply or text number
        const ctx = m.message?.extendedTextMessage?.contextInfo;
        const mentionedJid = ctx?.mentionedJid?.[0] || null;
        const quotedParticipant = ctx?.participant || null;
        const targetNum = text.replace(/\D/g, "");
        const target = mentionedJid || quotedParticipant || (targetNum ? targetNum + "@s.whatsapp.net" : null);
        if (!target) return Reply(sock, jid, `Usage: ${settings.prefix}promote @user or reply to a message`, m);
        try {
          await sock.groupParticipantsUpdate(jid, [target], "promote");
          await React(sock, m, "⭐");
          await sendInteractive(sock, jid, {
            header: "⭐ Promoted",
            title: groupName,
            body: `⭐ @${target.split("@")[0]} has been *promoted to admin*!`,
            footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
          }, m);
        } catch (e) {
          await Reply(sock, jid, `❌ Failed: ${e.message}`, m);
        }
        break;
      }

      case "demote": {
        if (needGroup()) break;
        if (needAdmin()) break;
        if (needBotAdmin()) break;
        const ctx = m.message?.extendedTextMessage?.contextInfo;
        const mentionedJid = ctx?.mentionedJid?.[0] || null;
        const quotedParticipant = ctx?.participant || null;
        const targetNum = text.replace(/\D/g, "");
        const target = mentionedJid || quotedParticipant || (targetNum ? targetNum + "@s.whatsapp.net" : null);
        if (!target) return Reply(sock, jid, `Usage: ${settings.prefix}demote @user or reply to a message`, m);
        try {
          await sock.groupParticipantsUpdate(jid, [target], "demote");
          await React(sock, m, "⬇️");
          await sendInteractive(sock, jid, {
            header: "⬇️ Demoted",
            title: groupName,
            body: `⬇️ @${target.split("@")[0]} has been *demoted from admin*.`,
            footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
          }, m);
        } catch (e) {
          await Reply(sock, jid, `❌ Failed: ${e.message}`, m);
        }
        break;
      }

      case "kick": {
        if (needGroup()) break;
        if (needAdmin()) break;
        if (needBotAdmin()) break;
        const ctx = m.message?.extendedTextMessage?.contextInfo;
        const mentionedJid = ctx?.mentionedJid?.[0] || null;
        const quotedParticipant = ctx?.participant || null;
        const targetNum = text.replace(/\D/g, "");
        const target = mentionedJid || quotedParticipant || (targetNum ? targetNum + "@s.whatsapp.net" : null);
        if (!target) return Reply(sock, jid, `Usage: ${settings.prefix}kick @user or reply to a message`, m);
        if (target.split("@")[0] === botNumber) return Reply(sock, jid, "❌ I cannot kick myself.", m);
        try {
          await sock.groupParticipantsUpdate(jid, [target], "remove");
          await React(sock, m, "👢");
          await sendInteractive(sock, jid, {
            header: "👢 Kicked",
            title: groupName,
            body: `👢 @${target.split("@")[0]} has been *kicked* from the group.`,
            footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
          }, m);
        } catch (e) {
          await Reply(sock, jid, `❌ Failed: ${e.message}`, m);
        }
        break;
      }

      case "setgname": {
        if (needGroup()) break;
        if (needAdmin()) break;
        if (needBotAdmin()) break;
        if (!text) return Reply(sock, jid, `Usage: ${settings.prefix}setgname <new name>`, m);
        try {
          await sock.groupUpdateSubject(jid, text);
          await React(sock, m, "✏️");
          await sendInteractive(sock, jid, {
            header: "✏️ Group Renamed",
            title: text,
            body: `✅ Group name updated to:\n*${text}*`,
            footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
          }, m);
        } catch (e) {
          await Reply(sock, jid, `❌ Failed: ${e.message}`, m);
        }
        break;
      }

      case "setdesc": {
        if (needGroup()) break;
        if (needAdmin()) break;
        if (needBotAdmin()) break;
        if (!text) return Reply(sock, jid, `Usage: ${settings.prefix}setdesc <description>`, m);
        try {
          await sock.groupUpdateDescription(jid, text);
          await React(sock, m, "📝");
          await sendInteractive(sock, jid, {
            header: "📝 Description Updated",
            title: groupName,
            body: `✅ Group description set to:\n\n${text}`,
            footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
          }, m);
        } catch (e) {
          await Reply(sock, jid, `❌ Failed: ${e.message}`, m);
        }
        break;
      }

      case "setppgc": {
        if (needGroup()) break;
        if (needAdmin()) break;
        if (needBotAdmin()) break;
        // Image must be quoted or sent with the command
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg = m.message?.imageMessage || quotedMsg?.imageMessage;
        if (!imgMsg) return Reply(sock, jid, `Send or quote an image with ${settings.prefix}setppgc`, m);
        try {
          const { downloadMediaMessage } = require("@whiskeysockets/baileys");
          const buf = await downloadMediaMessage(
            quotedMsg ? { message: quotedMsg, key: { remoteJid: jid, id: m.message.extendedTextMessage.contextInfo.stanzaId, fromMe: false } } : m,
            "buffer", {},
            { logger: { info(){}, error(){}, warn(){}, debug(){}, child(){ return this; } } }
          );
          await sock.updateProfilePicture(jid, buf);
          await React(sock, m, "🖼️");
          await sendInteractive(sock, jid, {
            header: "🖼️ Group Photo Updated",
            title: groupName,
            body: `✅ Group profile picture has been updated!`,
            footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
          }, m);
        } catch (e) {
          await Reply(sock, jid, `❌ Failed: ${e.message}`, m);
        }
        break;
      }

      // ═══════════════ BOT MODE ═══════════════
      case "public": {
        if (!isOwner) return Reply(sock, jid, "❌ Owner only.", m);
        settings.mode = "public";
        await React(sock, m, "🌍");
        await sendInteractive(sock, jid, {
          header: "🌍 Public Mode", title: "Bot Mode Changed",
          body: `🌍 Bot is now *PUBLIC*\nEveryone can use commands.`,
          footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
        }, m);
        break;
      }

      case "self": {
        if (!isOwner && !userIsPremium) return Reply(sock, jid, "❌ Owner/Premium only.", m);
        settings.mode = "self";
        await React(sock, m, "🔒");
        await sendInteractive(sock, jid, {
          header: "🔒 Self Mode", title: "Bot Mode Changed",
          body: `🔒 Bot is now *SELF*\nOnly owner & premium can use commands.`,
          footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
        }, m);
        break;
      }

      // ═══════════════ RENTBOT ═══════════════
      case "rentbot":
      case "pair":
      case "bot": {
        if (!isOwner) return Reply(sock, jid, "❌ Owner only.", m);
        if (!text) return Reply(sock, jid, `Usage: ${settings.prefix}${command} <number>`, m);
        const rentNum = text.replace(/\D/g, "");
        if (rentNum.length < 7) return Reply(sock, jid, "❌ Invalid number.", m);
        const rentDB = getRentDB();
        if (rentDB.sessions.find(s => s.number === rentNum))
          return Reply(sock, jid, `⚠️ Session for *${rentNum}* already exists.`, m);
        const sessionDir = path.resolve(`./session/rent_${rentNum}`);
        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
        const configPath = `./database/rent_${rentNum}.json`;
        fs.writeFileSync(configPath, JSON.stringify({
          number: rentNum, sessionId: `rent_${rentNum}`, sessionDir,
          prefix: settings.prefix, botName: settings.botName,
          ownerNumber: settings.ownerNumber, createdAt: new Date().toISOString(), active: false,
        }, null, 2));
        rentDB.sessions.push({ number: rentNum, configPath, sessionDir, active: false });
        saveRentDB(rentDB);
        await React(sock, m, "✅");
        await sendInteractive(sock, jid, {
          header: "🤖 Rent Bot", title: "Session Created",
          body:
            `✅ Session registered for *+${rentNum}*\n\n` +
            `📁 *Dir:* session/rent_${rentNum}\n` +
            `📄 *Config:* database/rent_${rentNum}.json\n\n` +
            `Restart the panel to load this session.`,
          footer: settings.footerText, btnLabel: "📢 Channel", btnUrl: settings.telegramChannel,
        }, m);
        break;
      }

      // ═══════════════ PREMIUM ═══════════════
      case "mypremium": {
        await sendInteractive(sock, jid, {
          header: "👑 Premium Status", title: "Your Account",
          body: `📱 *Number:* ${senderNum}\n${userIsPremium ? "✅ *Premium User*" : "❌ *Free User*"}`,
          footer: settings.footerText,
          btnLabel: userIsPremium ? "✅ Active" : "💳 Get Premium",
          btnUrl: settings.telegramChannel,
        }, m);
        break;
      }

      case "buypremium": {
        await sendInteractive(sock, jid, {
          header: "💳 Buy Premium", title: "Get Premium Access",
          body: `Unlock all premium features!\nContact the owner to purchase.`,
          footer: settings.footerText, btnLabel: "💬 Chat Owner",
          btnUrl: `https://wa.me/${settings.ownerNumber}`,
        }, m);
        break;
      }

      case "addpremium": {
        if (!isOwner) return Reply(sock, jid, "❌ Owner only.", m);
        if (!text) return Reply(sock, jid, `Usage: ${settings.prefix}addpremium <number>`, m);
        const num = text.replace(/\D/g, "");
        if (!premDB.premiumUsers.includes(num)) premDB.premiumUsers.push(num);
        fs.writeFileSync("./database/premium.json", JSON.stringify(premDB, null, 2));
        await React(sock, m, "✅");
        await Reply(sock, jid, `✅ *${num}* added to premium.`, m);
        break;
      }

      case "delpremium": {
        if (!isOwner) return Reply(sock, jid, "❌ Owner only.", m);
        if (!text) return Reply(sock, jid, `Usage: ${settings.prefix}delpremium <number>`, m);
        const num = text.replace(/\D/g, "");
        premDB.premiumUsers = premDB.premiumUsers.filter(n => n !== num);
        fs.writeFileSync("./database/premium.json", JSON.stringify(premDB, null, 2));
        await React(sock, m, "✅");
        await Reply(sock, jid, `✅ *${num}* removed from premium.`, m);
        break;
      }

      case "listpremium": {
        if (!isOwner) return Reply(sock, jid, "❌ Owner only.", m);
        if (!premDB.premiumUsers.length) return Reply(sock, jid, "📋 No premium users.", m);
        const list = premDB.premiumUsers.map((n, i) => `${i + 1}. ${n}`).join("\n");
        await Reply(sock, jid, `👑 *Premium Users:*\n\n${list}`, m);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[case.js] Error:", err);
  }
}

module.exports = { handleMessage };
