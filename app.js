require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const _ = require('lodash');
const moment = require('moment-timezone');
const btoa = require('btoa');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const discordModule = require('./discord');
const common = require('./common');
const datasource = require('./postgres');

const TAG = '[magios-datacollector-bot]';

const PORT = process.env.PORT || 3000;
const app = express();

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

/*app.use((req, res, next) => {

    if (req.url.indexOf('/oauth/redirect') >= 0 ||
        req.url.indexOf('/server-alive') >= 0 ||
        req.url.indexOf('/user-join-server') >= 0 ||
        req.url.indexOf('/api') >= 0 ||
        req.url.indexOf('/not-allow') >= 0 ||
        req.url.indexOf('/logout') >= 0) {
            next();
    } else {
        const authToken = req.cookies['AuthToken'];
        if (!authToken) {
            res.redirect(process.env.DISCORD_OAUTH +'/authorize?client_id='+process.env.DISCORD_CLIENT_ID+'&scope=identify&response_type=code&redirect_uri='+encodeURIComponent(process.env.APP_URL +'/oauth/redirect'));    
        } else {
            next();
        }
    }    
})*/

app.listen(PORT, () => {
    console.log(`${TAG} - WebApp is running on port ${ PORT }.`);
});

app.post('/api/user-join-server', (req, res) => {
    const username = req.body.username.trim().toLowerCase();
    const serverId = req.body.serverId.trim();
    const ip = req.body.ip.trim();

    datasource.findUserByUsername(username).then(user => {
        if (!user) {
            discordModule.sendMessageToReportChannel('Unknown user: ' + username + ' with ip: ' + ip + ' has logged in at Server ' + serverId + '.');
            console.log(TAG + ' - Unknown user: ' + username + ' with ip: ' + ip + ' has logged in at Server ' + serverId + '.');
        } else {
            user.lastServerAccess = common.getToDay().format('DD/MM/YYYY HH:mm:ss');
            user.lastServerId = serverId;
            user.lastServerAccessIp = ip;
            discordModule.sendMessageToReportChannel('User: ' + username + ' with ip: ' + ip + ' has logged in at Server ' + serverId + '. Was updated.');
            console.log(TAG + ' - User: ' + username + ' with ip: ' + ip + ' has logged in at Server ' + serverId + '. Was updated.');
            datasource.updateUser(user);
        }
    });

    res.status(200).send();
});

app.get('/api/server-alive/:serverId', async  (req, res) => {
    
    console.log(TAG + ' - Server ' + req.params.serverId + ' requesting last alive date.');
    const serverStatus = await datasource.getServerStatusById(req.params.serverId);
    res.json({response: serverStatus});
});

app.get('/api/modules', async (req, res) => {
    const terrains = [];
    for (let i = 0; i < common.terrains.length; i++)
        terrains.push({id: i, name: common.terrains[i], visible: true});

    const jets = [];
    for (let i = 0; i < common.jets.length; i++)
        jets.push({id: i, name: common.jets[i], visible: true});

    const warbirds = [];
    for (let i = 0; i < common.warbirds.length; i++)
        warbirds.push({id: i, name: common.warbirds[i], visible: true});

    const helis = [];
    for (let i = 0; i < common.helis.length; i++)
        helis.push({id: i, name: common.helis[i], visible: true});

    const others = [];
    for (let i = 0; i < common.others.length; i++)
        others.push({id: i, name: common.others[i], visible: true});

    res.json({terrains: terrains, jets: jets, warbirds: warbirds, helis: helis, others: others });
});

app.get('/api/modules/user', async (req, res) => {
    const all = await datasource.getAllUsers();
    let users = all.filter(u => u.roles && u.roles.find(r => r == 'Magios' || r == 'NewJoiner' ));
    users = _.sortBy(users, ['username'], ['asc']);

    res.json({users: users});
});

app.put('/api/modules/user/status/:userId', async (req, res) => {
    const userId = req.params.userId;
    const user = await datasource.getUser(userId);
    if (!user.status) user.status = true;
    else user.status = false;
    await datasource.updateUser(user);
    res.json({user: user});
});

app.put('/api/modules/user/country/:userId', async (req, res) => {
    const userId = req.params.userId;
    const country = req.body.country;
    const user = await datasource.getUser(userId);
    user.country = country;
    await datasource.updateUser(user);
    res.json({user: user});
});

app.put('/api/modules/user/:userId', async (req, res) => {

    const userId = req.params.userId;
    const moduleKey = req.body.module;
    const index = parseInt(req.body.index);
    const flag = req.body.flag;

    let module;
    switch(moduleKey) {
        case 'terrains':
            module = common.terrains[index];
            break;
        case 'jets':
            module = common.jets[index];
            break;
        case 'warbirds':
            module = common.warbirds[index];
            break;
        case 'helis':
            module = common.helis[index];
            break;
        case 'others':
            module = common.others[index];
            break;
    }

    const user = await datasource.getUser(userId);
    if (flag) {
        user.modules.push(module);
    } else {
        user.modules = user.modules.filter(m => m !== module);
    }
    await datasource.updateUser(user);

    res.json({user: user});
});

app.post('/api/server-alive/:serverId', async  (req, res) => {
    console.log(TAG + ' - Server ' + req.params.serverId + ' is alive.');

    const updated = req.body.updated.trim();

    await datasource.updateServerStatus({id: req.params.serverId, status: true, updated: updated});

    await discordModule.cleanServerStatus();
    const servers = await datasource.getServerStatus();
    servers.forEach(async server => {
        await discordModule.sendServerStatus(server);
        console.log(TAG + ' - Server ' + server.id + ' status was reported to discord as online = ' + server.status);
    });
    
    res.status(200).send();
});

app.post('/oauth/redirect', async (req, res) => {

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
        { method: 'GET',
        headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const discordUser =  await response2.json();
    let username = discordUser.username.toLowerCase();

    const user = await datasource.findUserByUsername(username);
    if (user && user.roles.find(r => r == 'Admins' || r == 'Magios' || r == 'NewJoiner')) {
        res.json({allow:true, user: user});
    } else {
        res.json({allow: false});
    }
});

app.get('/oauth/redirect', async (req, res) => {
    res.sendFile(__dirname + '/angular/my-app/dist/my-app/index.html');
});

app.get('/magios', async (req, res) =>{
    const all = await datasource.getAllUsers();
    let magios = all.filter(u => u.roles && u.roles.find(r => r == 'Magios'));
    magios = _.sortBy(magios, [ u => { return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); }], ['asc']);

    res.status(200).render('user-list', {title: 'Magios', users: magios });
});

app.get('/newjoiners', async (req, res) =>{
    const all = await datasource.getAllUsers();
    let newJoiner = all.filter(u => u.roles && u.roles.find(r => r == 'NewJoiner'));
    newJoiner = _.sortBy(newJoiner, [ u => { return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); }], ['asc']);

    res.status(200).render('user-list', {title: 'NewJoiner', users: newJoiner });
});

app.get('/limbo', async (req, res) =>{
    const all = await datasource.getAllUsers();
    let limbo = all.filter(u => u.roles && u.roles.find(r => r == 'Limbo'));
    limbo = _.sortBy(limbo, [ u => { return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); }], ['asc']);

    res.status(200).render('user-list', {title:'Limbo', users: limbo});
});

app.get('/norole', async (req, res) =>{
    const all = await datasource.getAllUsers();
    let norole = all.filter(u => !u.roles || u.roles == '');
    norole = _.sortBy(norole, [ u => { return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); }], ['asc']);

    res.status(200).render('user-list', {title:'No role', users: norole });
});

app.get('/server-status', async (req, res) =>{
    const all = await datasource.getAllUsers();
    let norole = all.filter(u => !u.roles || u.roles == '');
    norole = _.sortBy(norole, [ u => { return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); }], ['asc']);

    const servers = await datasource.getServerStatus();

    res.status(200).render('server-status', {server1Status: servers[0], server2Status: servers[1] });
});