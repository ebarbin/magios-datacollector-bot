const cron = require('node-cron');
const moment = require('moment-timezone');
const discordModule = require('./discord');

const common = require('./common');;

const TAG = '[magios-datacollector-bot]';

console.log(TAG + ' - Cron module start.');

cron.schedule('*/1 * * * *', () => {
    console.log(TAG + ' - Cleaning old events - Running a task every 2 hours.');

    discordModule.cleanOldEvents().then((quantity) => {
        console.log(TAG + ' - ' + quantity + ' events was deleted from discord.');
    }).catch(err => {
        console.log(TAG + ' Error - Cleaning old events. ' + err);
    }) ;
});

cron.schedule('*/10 * * * *', () => {
    console.log(TAG + ' - Checking server status - Running a task every 10 minutes.');
    discordModule.cleanServerStatus().then(() => {
        common.serverStatus.forEach(se => {
            se.online = !se.lastMessage || common.getToDay().diff(se.lastMessage, 'minutes') > 15;
            discordModule.sendServerStatus(se).then(() => {
                console.log(TAG + ' - Server ' + se.serverId + ' status was reported to discord.');
            });
        });
    })
});