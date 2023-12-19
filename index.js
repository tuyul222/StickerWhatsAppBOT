const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment-timezone');
const colors = require('colors');
const fs = require('fs');

const client = new Client({
    restartOnAuthFail: true,
    puppeteer: {
        headless: true,
        args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
    },
    ffmpeg: './ffmpeg.exe',
    authStrategy: new LocalAuth({ clientId: "client" })
});
const config = require('./config/config.json');

client.on('qr', (qr) => {
    console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] Scan the QR below : `);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.clear();
    const consoleText = './config/console.txt';
    fs.readFile(consoleText, 'utf-8', (err, data) => {
        if (err) {
            console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] Console Text not found!`.yellow);
            console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] ${config.name} is Already!`.green);
        } else {
            console.log(data.green);
            console.log(`[${moment().tz(config.timezone).format('HH:mm:ss')}] ${config.name} is Already!`.green);
        }
    });
});

client.on('message', async (message) => {
    const isGroups = message.from.endsWith('@g.us') ? true : false;
    if ((isGroups && config.groups) || !isGroups) {

        // Image to Sticker (With Reply Image)
        if (message.body == `${config.prefix}sticker`) {
            const quotedMsg = await message.getQuotedMessage(); 
            if (message.hasQuotedMsg && quotedMsg.hasMedia) {
                client.sendMessage(message.from, "*[⏳]* Loading..");
                try {
                    const media = await quotedMsg.downloadMedia();
                    client.sendMessage(message.from, media, {
                        sendMediaAsSticker: true,
                        stickerName: config.name, // Sticker Name = Edit in 'config/config.json'
                        stickerAuthor: config.author // Sticker Author = Edit in 'config/config.json'
                    }).then(() => {
                        client.sendMessage(message.from, "*[✅]* Successfully!");
                    });
                } catch {
                    client.sendMessage(message.from, "*[❎]* Failed!");
                }
            } else {
                client.sendMessage(message.from, "*[❎]* Reply Image First!");
            }

        // Sticker to Image (With Reply Sticker)
        } else if (message.body == `${config.prefix}image`) {
            const quotedMsg = await message.getQuotedMessage(); 
            if (message.hasQuotedMsg && quotedMsg.hasMedia) {
                client.sendMessage(message.from, "*[⏳]* Loading..");
                try {
                    const media = await quotedMsg.downloadMedia();
                    client.sendMessage(message.from, media).then(() => {
                        client.sendMessage(message.from, "*[✅]* Successfully!");
                    });
                } catch {
                    client.sendMessage(message.from, "*[❎]* Failed!");
                }
            } else {
                client.sendMessage(message.from, "*[❎]* Reply Sticker First!");
            }

        // Read chat
        } else {
            client.getChatById(message.id.remote).then(async (chat) => {
                await chat.sendSeen();
            });
        }
    }
});

client.initialize();
