const cron = require('node-cron');
const moment = require('moment-timezone');
const discordModule = require('./discord');
const datasource = require('./postgres');

const common = require('./common');;

const TAG = '[magios-datacollector-bot]';

console.log(TAG + ' - Cron module is started.');

const tasks = [];
const task1 = cron.schedule('*/120 * * * *', () => {
    console.log(TAG + ' - Cleaning old events - Running a task every 2 hours.');

    discordModule.cleanOldEvents().then((quantity) => {
        console.log(TAG + ' - ' + quantity + ' events was deleted from discord.');
    }).catch(err => {
        console.log(TAG + ' Error - Cleaning old events. ' + err);
    }) ;
});
task1.id = 1;
task1.running = true;
task1.desc = 'Cleaning old events - Running a task every 2 hours';
tasks.push(task1);

const task2 = cron.schedule('*/10 * * * *', async () => {
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
            if (!server.status) {
                await discordModule.sendMessageToLogDiscordChannel('Server ' + server.id + ' is ONLINE again.');
            } 
            server.status = true;
            server.notified = false;
        }

        await datasource.updateServer(server);

        await discordModule.sendServerStatus(server);
    });
});
task2.id = 2;
task2.running = true;
task2.desc = 'Checking server status - Running a task every 10 minutes';
tasks.push(task2);

const task3 = cron.schedule('0 0 0 1 */1 *', async () => {
    console.log(TAG + ' - Moving stats to history and reset current - Running a task every month.');
    const users = await datasource.getAllUsers();
    users.forEach(async user => {
        user.statsHistory.push({ date: common.getToDay().format('DD/MM/YYYY'), stats: [ {...users.stats[0]}, {...users.stats[1]}, {...users.stats[2]}] });
        user.stats = [
            { lastEvent: null, lastDate: null, takeoff:0, land: 0, kill: 0, crash: 0, hit: 0, shot: 0, dead: 0 },
            { lastEvent: null, lastDate: null, takeoff:0, land: 0, kill: 0, crash: 0, hit: 0, shot: 0, dead: 0 },
            { lastEvent: null, lastDate: null, takeoff:0, land: 0, kill: 0, crash: 0, hit: 0, shot: 0, dead: 0 }
        ];
        user.eventsHistory = [...user.events];
        user.events = [];
        await datasource.updateUser(user);
    });
    await discordModule.sendMessageToLogDiscordChannel('Monthly moving user events/stats to history and reset currents.');
});
task3.id = 3;
task3.running = true;
task3.desc = 'Moving stats to history and reset current - Running a task every month';
tasks.push(task3);

const task4 = cron.schedule('0 0 0 2 */1 *', async () => {
    console.log(TAG + ' - Notifying limbo/none rol users - Running a task every month.');
    const limbosOrNoneRoleUsers = await datasource.getLimboOrNoneRoleUsers();
    limbosOrNoneRoleUsers.forEach(async u => { await discordModule.notifyLimboOrNonRoleUser(u); });
    await discordModule.sendMessageToLogDiscordChannel('Monthly message sended to user in limbo.');
});
task4.id = 4;
task4.running = true;
task4.desc = 'Notifying limbo/none rol users - Running a task every month';
tasks.push(task4);

const task5 = cron.schedule('0 0 0 3 */1 *', async () => {
    console.log(TAG + ' - Notifying non active users.');
    const allUsers = await datasource.getAllUsers();
    allUsers.forEach(async u => {
        if (common.getToDay().diff(moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss'), 'days') > 30) {
            await discordModule.notifyUsers(u);
        }
    });
    await discordModule.sendMessageToLogDiscordChannel('Monthly message sended to users that we know nothing about them.');
});
task5.id = 5;
task5.running = true;
task5.desc = 'Notifying non active users';
tasks.push(task5);

getTaskStatus = (taskId) => {
    return tasks[taskId-1].running;
}

getAllTask = () => {
    return tasks;
}

toggleTasktatus = (taskId) => {
    const task = tasks[taskId-1];
    if (task.running) {
        task.stop();
        task.running = false;
    } else {
        task.start();
        task.running = true;
    }
    return task.running;
}

exports.getAllTask = getAllTask;
exports.getTaskStatus = getTaskStatus;
exports.toggleTasktatus = toggleTasktatus;