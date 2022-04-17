const cron = require('node-cron');
const moment = require('moment-timezone');
const discordModule = require('./discord');
const datasource = require('./postgres');

const common = require('./common');;

const TAG = '[magios-datacollector-bot]';

console.log(TAG + ' - Cron module is started.');

const tasks = [];
const task1 = cron.schedule('*/120 * * * *', async () => {
    await executeTask1();
}, { scheduled: false, timezone: "America/Argentina/Buenos_Aires" });

task1.id = 1;
task1.running = process.env.environment != 'dev';
task1.desc = 'Cleaning old events - Running a task every 2 hours';
tasks.push(task1);

executeTask1 = async () => {
    console.log(TAG + ' - Cleaning old events - Running a task every 2 hours.');
    await discordModule.cleanOldEvents();
}

const task2 = cron.schedule('*/10 * * * *', async () => {
    await executeTask2();
}, { scheduled: false, timezone: "America/Argentina/Buenos_Aires" });

task2.id = 2;
task2.running = process.env.environment != 'dev';
task2.desc = 'Checking server status - Running a task every 10 minutes';
tasks.push(task2);

executeTask2 = async () => {
    console.log(TAG + ' - Checking server status - Running a task every 10 minutes.');
    await discordModule.cleanServerStatus();

    const servers = await datasource.getServerStatus();

    servers.forEach(async server => {
        if (common.getToDay().diff(moment(server.updated, 'YYYY-MM-DD HH:mm:ss.SSS'), 'minutes') > 15) {
            server.status = false;

            if (!server.notified && !server.skipnotification) {
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
}

const task3 = cron.schedule('0 0 0 1 */1 *', async () => {
    await executeTask3();
}, { scheduled: false, timezone: "America/Argentina/Buenos_Aires" });

task3.id = 3;
task3.running = process.env.environment != 'dev';
task3.desc = 'Moving stats to history and reset current - Running a task every month';
tasks.push(task3);

executeTask3 = async () => {
    console.log(TAG + ' - Moving stats to history and reset current - Running a task every month.');
    const users = await datasource.getAllUsers();
    users.forEach(async user => {
        user.statsHistory.push({ date: common.getToDay().format('DD/MM/YYYY'), stats: [ {...user.stats[0]}, {...user.stats[1]}, {...user.stats[2]}] });
        user.stats = [
            { lastEvent: null, lastDate: null, takeoff:0, land: 0, kill: 0, crash: 0, hit: 0, shot: 0, dead: 0 },
            { lastEvent: null, lastDate: null, takeoff:0, land: 0, kill: 0, crash: 0, hit: 0, shot: 0, dead: 0 },
            { lastEvent: null, lastDate: null, takeoff:0, land: 0, kill: 0, crash: 0, hit: 0, shot: 0, dead: 0 }
        ];
        if (!user.eventsHistory) {
            user.eventsHistory = [...user.events];
        } else {
            user.eventsHistory = user.eventsHistory.concat(user.events);
        }
        user.events = [];
        await datasource.updateUser(user);
    });
    await discordModule.sendMessageToLogDiscordChannel('Monthly moving user events/stats to history and reset currents.');
}

const task4 = cron.schedule('0 0 0 2 */1 *', async () => {
    await executeTask4();
}, { scheduled: false, timezone: "America/Argentina/Buenos_Aires" });

task4.id = 4;
task4.running = process.env.environment != 'dev';
task4.desc = 'Notifying limbo/none rol users - Running a task every month';
tasks.push(task4);

executeTask4 = async () => {
    console.log(TAG + ' - Notifying limbo/none rol users - Running a task every month.');
    const limbosOrNoneRoleUsers = await datasource.getLimboOrNoneRoleUsers();
    limbosOrNoneRoleUsers.forEach(async u => { await discordModule.notifyLimboOrNonRoleUser(u); });
    await discordModule.sendMessageToLogDiscordChannel('Monthly message sended to user in limbo.');
}

const task5 = cron.schedule('0 0 0 3 */1 *', async () => {
    await executeTask5();
}, { scheduled: false, timezone: "America/Argentina/Buenos_Aires" });

task5.id = 5;
task5.running = process.env.environment != 'dev';
task5.desc = 'Notifying non active users - Running a task every month';
tasks.push(task5);

executeTask5 = async () => {
    console.log(TAG + ' - Notifying non active users - Running a task every month');
    const allUsers = await datasource.getAllUsers();
    allUsers.forEach(async u => {
        if (common.getToDay().diff(moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss'), 'days') > 30) {
            await discordModule.notifyUsers(u);
        }
    });
    await discordModule.sendMessageToLogDiscordChannel('Monthly message sended to users that we know nothing about them.');
}

if (process.env.environment != 'dev') {
    tasks.forEach(t => { t.start(); });
} else {
    tasks.forEach(t => { t.stop(); });
}

executeTask = async (taskId) => {
    switch (taskId) {
        case 1:
            await executeTask1();
            break;
        case 2:
            await executeTask2();
            break;
        case 3:
            await executeTask3();
            break;
        case 4:
            await executeTask4();
            break;
        case 5:
            await executeTask5();
            break;
        default:
            break;
    }
    return tasks[taskId-1];
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
    return task;
}

exports.getAllTask = getAllTask;
exports.toggleTasktatus = toggleTasktatus;
exports.executeTask = executeTask;