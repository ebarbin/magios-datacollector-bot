require('dotenv').config();

const express = require('express');
const expressHbs = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');
const _ = require('lodash');
const moment = require('moment-timezone');
const btoa = require('btoa');
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
const { URLSearchParams } = require('url');

const discordModule = require('./discord');
const common = require('./common');
const datasource = require('./postgres');
const cron = require('./cron');

const TAG = '[magios-datacollector-bot]';

const PORT = process.env.PORT || 3000;
const app = express();

app.engine('hbs', expressHbs({ layoutsDir:'views/layouts/',  partialsDir:'views/layouts/', extname:'hbs', defaultLayout:'main' }));

app.set('view engine', 'hbs')
app.set('views', 'views');

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/images',express.static(path.join(__dirname, '/assets/images')));
app.use('/js',express.static(path.join(__dirname, '/assets/javascripts')));
app.use('/css',express.static(path.join(__dirname, '/assets/stylesheets')));

app.use((req, res, next) => {

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
})

app.listen(PORT, () => {
    console.log(`${TAG} - WebApp is running on port ${ PORT }.`);
});

userJoineServer = (req, res) => {
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
}

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

app.get('/oauth/redirect', async (req, res) => {

    const creds = btoa(process.env.DISCORD_CLIENT_ID + ':' + process.env.DISCORD_AUTH_SECRET);
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', req.query.code);
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
    

    if (user && user.roles.find(r=>r == 'Admins')) {
        res.cookie('AuthToken', access_token);
        res.redirect('/');
    } else {
        res.redirect('/not-allow');
    }
});

app.get('/logout', async (req, res) =>{   
    res.clearCookie("AuthToken");
    res.redirect('/');
});

app.get('/not-allow', async (req, res) =>{   
    res.status(200).render('not-allow');
});

app.get('/', async (req, res) => {

    let all = await datasource.getAllUsers();
    all = _.sortBy(all, [ u => { return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); }], ['asc']);
    res.status(200).render('user-list', {users: all, title: 'All'});
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

    res.status(200).render('server-status', {server1Status: servers[0].status, server2Status: servers[1].status });
});

app.get('/modules', async (req, res) =>{
    const all = await datasource.getAllUsers();
    let users = all.filter(u => u.roles && u.roles.find(r => r == 'Magios' || r == 'NewJoiner' ));

    const results = [];
    let result;
    let i;
    users.forEach(u => {
        result = {id: u.id, username: u.username, avatar: u.avatar};

        i = 0;
        common.terrains.forEach(t => {
            result['terrains_'+i] = false;
            if (_.includes(u.modules, t)) {
                result['terrains_'+i] = true;
            }
            i++;
        });

        i = 0;
        common.jets.forEach(t => {
            result['jets_'+i] = false;
            if (_.includes(u.modules, t)) {
                result['jets_'+i] = true;
            }
            i++;
        });

        i = 0;
        common.warbirds.forEach(t => {
            result['warbirds_'+i] = false;
            if (_.includes(u.modules, t)) {
                result['warbirds_'+i] = true;
            }
            i++;
        });

        i = 0;
        common.helis.forEach(t => {
            result['helis_'+i] = false;
            if (_.includes(u.modules, t)) {
                result['helis_'+i] = true;
            }
            i++;
        });

        i = 0;
        common.others.forEach(t => {
            result['others_'+i] = false;
            if (_.includes(u.modules, t)) {
                result['others_'+i] = true;
            }
            i++;
        });
        results.push(result);
    })

    res.status(200).render('modules', {users: results, terrains: common.terrains, jets: common.jets, warbirds: common.warbirds, helis: common.helis, others: common.others });
});

const fileUpload = require('express-fileupload');
app.use(fileUpload());

app.post('/api/thumbnail-upload', async (req, res) => {
    let file = req['files'].thumbnail;
    console.log("File uploaded: ", file.name);
    res.status(200)
 });