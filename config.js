const fs = require('fs')

const config = {
    owner: "-",
    botNumber: "-",
    setPair: "NIKA2026",
    thumbUrl: "https://files.catbox.moe/bvkgr4.jpg",
    session: "sessions",
    status: {
        public: true,
        terminal: true,
        reactsw: false
    },
    message: {
        owner: "no, this is for owners only",
        group: "this is for groups only",
        admin: "this command is for admin only",
        private: "this is specifically for private chat"
    },
    settings: {
        title: "NIKAV20",
        packname: 'NIKA V25',
        description: "this script was created by Depayy",
        author: 'https://www.kyuurzy.tech',
        footer: "Nika - 2026`"
    },
    newsletter: {
        name: "LuxOfficial",
        id: "120363422684021546@newsletter"
    },
    socialMedia: {
        YouTube: "https://youtube.com/@justinofficial-id",
        GitHub: "https://github.com/kiuur",
        Telegram: "https://t.me/luxoffc",
        ChannelWA: "https://whatsapp.com/channel/0029Vb7gbaPLNSa6B8zOHm3T"
    }
}

module.exports = config;

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
