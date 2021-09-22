const cron = require('node-cron');
const moment = require('moment-timezone');
const discordModule = require('./discord');
const datasource = require('./postgres');

const common = require('./common');;

const TAG = '[magios-datacollector-bot]';

console.log(TAG + ' - Cron module start.');

cron.schedule('*/120 * * * *', () => {
    console.log(TAG + ' - Cleaning old events - Running a task every 2 hours.');

    discordModule.cleanOldEvents().then((quantity) => {
        console.log(TAG + ' - ' + quantity + ' events was deleted from discord.');
    }).catch(err => {
        console.log(TAG + ' Error - Cleaning old events. ' + err);
    }) ;
});

cron.schedule('*/10 * * * *', async () => {
    console.log(TAG + ' - Checking server status - Running a task every 10 minutes.');
    discordModule.cleanServerStatus().then(async () => {

        const servers = await datasource.getServerStatus();

        servers.forEach(async server => {

            server.status = false;
            if (common.getToDay().diff(moment(server.updated, 'DD/MM/YYYY HH:mm:ss'), 'minutes') < 15) {
                server.status = true;
            }
            
            await datasource.updateServerStatus(server);
            discordModule.sendServerStatus(server).then(() => {
                console.log(TAG + ' - Server ' + se.id + ' status was reported to discord as online = ' + se.status);
            });
        });
    })
});