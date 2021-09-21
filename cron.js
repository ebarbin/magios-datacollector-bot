const cron = require('node-cron');
const moment = require('moment-timezone');

const SERVER_STATUS_CHANNEL = require('./discord').SERVER_STATUS_CHANNEL;
const EVENTOS_CALENDARIO_CHANNEL = require('./discord').EVENTOS_CALENDARIO_CHANNEL;

const MessageEmbed = require('discord.js').MessageEmbed;
const common = require('./common');;

const TAG = '[magios-datacollector-bot]';

console.log(TAG + ' - Cron module start.');

cron.schedule('*/120 * * * *', () => {
    console.log(TAG + ' - Cleaning old events - Running a task every 2 hours.');
    EVENTOS_CALENDARIO_CHANNEL.messages.fetch({ limit: 100 }).then(messages => {
        messages.forEach(m => {
            if (m.author.bot && m.author.username == 'sesh' && m.embeds && m.embeds.length > 0) {
                const embed = m.embeds[0];
                if (embed.title.indexOf('is starting now!') >= 0) {
                    const msgId = embed.description.split('/')[embed.description.split('/').length-1].split(')**')[0];
                    const originalMsg = m.channel.messages.cache.find(msg => msg.id == msgId);
                    const msgDate = moment(m.createdAt);
                    const rightNow = common.getToDay();
                    if (rightNow.diff(msgDate, 'hours') >= 24) {
                        m.delete();
                        if (originalMsg) {
                            originalMsg.delete();  
                        }
                    }
                }
            }
        })
    });
});

cron.schedule('*/10 * * * *', () => {
    console.log(TAG + ' - Checking server status - Running a task every 10 minutes.');

    SERVER_STATUS_CHANNEL.messages.fetch().then(ms => { 
        ms.forEach(msg => msg.delete() );
    }).catch();

    common.serverStatus.forEach(se => {
        if (!se.lastMessage || common.getToDay().diff(se.lastMessage, 'minutes') > 15) {
            se.online = true;
            const embed = new MessageEmbed()
                .setTitle('Servidor ' + se.serverId +': OFFLINE')
                .setColor('#c90000')
                .setTimestamp()
            SERVER_STATUS_CHANNEL.send(embed);
        } else {
            se.online = false;
            const embed = new MessageEmbed()
                .setTitle('Servidor ' + se.serverId +': ONLINE')
                .setColor('#00830b')
                .setTimestamp()
            SERVER_STATUS_CHANNEL.send(embed);
        }
    });
});