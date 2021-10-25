const cron = require('node-cron');
const moment = require('moment-timezone');
const discordModule = require('./discord');
const datasource = require('./postgres');

const common = require('./common');;

const TAG = '[magios-datacollector-bot]';

console.log(TAG + ' - Cron module is started.');

if (common.ENABLE_DISCORD_EVENTS) {
    
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
        await discordModule.cleanServerStatus();

        const servers = await datasource.getServerStatus();

        servers.forEach(async server => {
            if (common.getToDay().diff(moment(server.updated, 'YYYY-MM-DD HH:mm:ss.SSS'), 'minutes') > 15) {
                server.status = false;

                if (!server.notified) {
                    server.notified = true;
                    await discordModule.notifyOwner(server);
                }

            } else {
                server.status = true;
                server.notified = false;
            }

            await datasource.updateServer(server);

            await discordModule.sendServerStatus(server);
        });
    });

    cron.schedule('*/180 * * * *', async () => {
        console.log(TAG + ' - Checking users data and upate - Running a task every 3 hours.');
        await discordModule.checkNewUserAndCreate();
        await discordModule.checkLeftUsersAndRemove();
    });

    cron.schedule('0 0 0 1 */1 *', async () => {
        console.log(TAG + ' - Moving stats to history and reset current - Running a task every month.');
        const users = await datasource.getAllUsers();
        users.forEach(async u => {
            user.statsHistory.push({ date: common.getToDay().format('DD/MM/YYYY'), stats: [ {...users.stats[0]}, {...users.stats[1]}, {...users.stats[2]}] });
            user.stats = [
                { lastEvent: null, lastDate: null, takeoff:0, land: 0, kill: 0, crash: 0, hit: 0, shot: 0, dead: 0 },
                { lastEvent: null, lastDate: null, takeoff:0, land: 0, kill: 0, crash: 0, hit: 0, shot: 0, dead: 0 },
                { lastEvent: null, lastDate: null, takeoff:0, land: 0, kill: 0, crash: 0, hit: 0, shot: 0, dead: 0 }
            ];
            await datasource.updateUser(u);
        })

        console.log(TAG + ' - Notifying limbo/none rol users - Running a task every month.');
        const limbosOrNoneRoleUsers = await datasource.getLimboOrNoneRoleUsers();
        limbosOrNoneRoleUsers.forEach(async u => {
            await discordModule.notifyLimboOrNonRoleUser(u);
        })
    });
}