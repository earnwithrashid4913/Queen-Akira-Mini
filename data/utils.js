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

/**
 * Read a local JSON file safely
 */
function readJSON(filePath) {
  try {
    const abs = path.resolve(filePath);
    if (!fs.existsSync(abs)) return null;
    return JSON.parse(fs.readFileSync(abs, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Write a local JSON file
 */
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(path.resolve(filePath), JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Format number to WhatsApp JID
 */
function toJid(number) {
  return number.includes("@") ? number : `${number.replace(/\D/g, "")}@s.whatsapp.net`;
}

/**
 * Check if a number is premium from local DB
 */
function isPremium(sender, db) {
  const num = sender.split("@")[0];
  return Array.isArray(db?.premiumUsers) && db.premiumUsers.includes(num);
}

/**
 * Format bytes to human-readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Runtime uptime string
 */
function uptime() {
  const s = process.uptime();
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${h}h ${m}m ${sec}s`;
}

module.exports = { readJSON, writeJSON, sleep, toJid, isPremium, formatBytes, uptime };
