require('dotenv').config();
require('./cron');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const _ = require('lodash');
const btoa = require('btoa');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const discordModule = require('./discord');

const common = require('./common');
const datasource = require('./postgres');

const TAG = '[magios-datacollector-bot]';

const PORT = process.env.PORT || 3000;
const app = express();

let sessions = [];

app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

app.use(express.static(process.cwd() + "/angular/my-app/dist/my-app/"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.listen(PORT, () => {
    console.log(`${TAG} - WebApp is running on port ${ PORT }.`);
});

checkUserAuth = (req, res, next) => {
    if (!req.headers.userid) return res.status(401).send();
    else {
        if (sessions.find(s => s == req.headers.userid)) next();
        else return res.status(401).send();
    }
}

app.get('/api/modules', checkUserAuth, async (req, res) => {
    const terrains = [];
    for (let i = 0; i < common.terrains.length; i++) terrains.push({id: i, name: common.terrains[i], visible: true});

    const jets = [];
    for (let i = 0; i < common.jets.length; i++) jets.push({id: i, name: common.jets[i], visible: true});

    const warbirds = [];
    for (let i = 0; i < common.warbirds.length; i++) warbirds.push({id: i, name: common.warbirds[i], visible: true});

    const helis = [];
    for (let i = 0; i < common.helis.length; i++) helis.push({id: i, name: common.helis[i], visible: true});

    const others = [];
    for (let i = 0; i < common.others.length; i++) others.push({id: i, name: common.others[i], visible: true});

    res.json({terrains: terrains, jets: jets, warbirds: warbirds, helis: helis, others: others });
});

app.get('/api/modules/user', checkUserAuth, async (req, res) => {

    const all = await datasource.getAllUsers();
    let users = all.filter(u => u.roles && u.roles.find(r => r == 'Magios' || r == 'NewJoiner' ));
    users = _.sortBy(users, ['username'], ['asc']);

    res.json({users: users});
});

app.put('/api/modules/user/status/:userId', checkUserAuth, async (req, res) => {
    const userId = req.params.userId;
    const user = await datasource.getUser(userId);
    if (!user.status) user.status = true;
    else user.status = false;
    await datasource.updateUser(user);
    res.json({user: user});
});

app.put('/api/modules/user/country/:userId', checkUserAuth, async (req, res) => {
    const userId = req.params.userId;
    const country = req.body.country;
    const user = await datasource.getUser(userId);
    user.country = country;
    await datasource.updateUser(user);
    res.json({user: user});
});

app.put('/api/modules/user/:userId', checkUserAuth, async (req, res) => {

    const userId = req.params.userId;
    const moduleKey = req.body.module;
    const index = parseInt(req.body.index);
    const flag = req.body.flag;

    let module;
    if (moduleKey == 'terrains') module = common.terrains[index];
    else if (moduleKey == 'jets') module = common.jets[index];
    else if (moduleKey == 'warbirds') module = common.warbirds[index];
    else if (moduleKey == 'helis') module = common.helis[index];
    else if (moduleKey == 'others') module = common.others[index];

    const user = await datasource.getUser(userId);

    if (flag) user.modules.push(module);
    else user.modules = user.modules.filter(m => m !== module);
    
    await datasource.updateUser(user);

    res.json({user: user});
});

app.get('/api/users', checkUserAuth, async (req, res) =>{
    const all = await datasource.getAllUsers();
    res.json({users: all});
});

app.post('/oauth/login', async (req, res) => {

    const creds = btoa(process.env.DISCORD_CLIENT_ID + ':' + process.env.DISCORD_AUTH_SECRET);
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', req.body.code);
    params.append('redirect_uri', process.env.APP_URL +'/oauth/redirect');

    const response = await fetch(process.env.DISCORD_OAUTH + '/token',
        { method: 'POST',
        headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    const json = await response.json();
    const access_token = json.access_token;
    
    const response2 = await fetch(process.env.DISCORD_OAUTH_USERS_ME,
        { method: 'GET', headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const discordUser =  await response2.json();
    if (!discordUser.username) {
        return res.status(401).send();
    } else {
        let username = discordUser.username.toLowerCase();

        const user = await datasource.findUserByUsername(username);
        if (user && user.roles.find(r => r == 'Admins' || r == 'Magios' || r == 'NewJoiner')) {
            sessions.push(user.id);
            return res.json({user: user});
        } else {
            await discordModule.sendMessageToReportChannel('The not authorized user "' + username + '" was trying to login Magios Web Site.');
            return res.status(401).send();
        }
    }
});

app.post('/oauth/logout', (req, res) => {
    sessions = sessions.filter(s => s != req.headers.userid);
    res.json();
});

app.get('/oauth/redirect', async (req, res) => {
    res.sendFile(__dirname + '/angular/my-app/dist/my-app/index.html');
});

app.get('/modules', async (req, res) => {
    res.sendFile(__dirname + '/angular/my-app/dist/my-app/index.html');
});

app.get('/welcome', async (req, res) => {
    res.sendFile(__dirname + '/angular/my-app/dist/my-app/index.html');
});

app.get('/userStats', async (req, res) => {
    res.sendFile(__dirname + '/angular/my-app/dist/my-app/index.html');
});

app.post('/api/server-alive/:serverId', async (req, res) => {
    const updated = req.body.updated.trim();
    await datasource.updateServer({id: req.params.serverId, status: true, updated: updated, notified: false});
    console.log(TAG + ' - Server ' + req.params.serverId + ' status was updated as ONLINE.');
    res.status(200).send();
});

app.post('/api/user-join-server', async (req, res) => {
    const username = req.body.username.trim().toLowerCase();
    const serverId = req.body.serverId.trim();
    const ip = req.body.ip.trim();

    const user = await datasource.findUserByUsername(username);
    if (!user) {
        await discordModule.sendMessageToReportChannel('Unknown user "' + username + '" with ip ' + ip + ' has logged at Server ' + serverId + '.');
        console.log(TAG + ' - Unknown user: "' + username + '" with ip: ' + ip + ' has logged in Server ' + serverId + '.');
    } else {
        user.lastServerAccess = common.getToDay().format('DD/MM/YYYY HH:mm:ss');
        user.lastServerId = serverId;
        user.lastServerAccessIp = ip;
        await  discordModule.sendMessageToReportChannel('The user "' + username + '" with ip ' + ip + ' has logged in Server ' + serverId + '.');
        console.log(TAG + ' - The user: "' + username + '" with ip: ' + ip + ' has logged in Server ' + serverId + '.');
        await datasource.updateUser(user);
    }

    res.status(200).send();
});

app.get('/api/server-alive/:serverId', async  (req, res) => {
    console.log(TAG + ' - Server ' + req.params.serverId + ' requesting last alive date.');
    const serverStatus = await datasource.getServerStatusById(req.params.serverId);
    res.json({response: serverStatus});
});