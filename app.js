require('dotenv').config();
const express = require('express');
const expressHbs = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');
const _ = require('lodash');
const moment = require('moment-timezone');

const commons = require('./common');
const datasource = require('./postgres');
const REPORT_CHANNEL = require('./discord').REPORT_CHANNEL;

const TAG = '[magios-datacollector-bot]';

const PORT = process.env.PORT || 3000;
const app = express();

app.engine('hbs', expressHbs({ layoutsDir:'views/layouts/',  partialsDir:'views/layouts/', extname:'hbs', defaultLayout:'main' }));

app.set('view engine', 'hbs')
app.set('views', 'views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/images',express.static(path.join(__dirname, '/assets/images')));
app.use('/js',express.static(path.join(__dirname, '/assets/javascripts')));
app.use('/css',express.static(path.join(__dirname, '/assets/stylesheets')));

app.listen(PORT, () => {
    console.log(`${TAG} - WebApp is running on port ${ PORT }`);
});

app.post('/api/user-join-server', (req, res) => {

    const username = req.body.username.trim().toLowerCase();
    const serverId = req.body.serverId.trim();
    const ip = req.body.ip.trim();

    datasource.findUserByUsername(username).then(user => {
        if (!user) {
            REPORT_CHANNEL.send('Unknown user: ' + username + ' with ip: ' + ip + ' has logged in at Server ' + serverId + '.');
            console.log(TAG + ' - Unknown user: ' + username + ' with ip: ' + ip + ' has logged in at Server ' + serverId + '.');
        } else {
            user.lastServerAccess = commons.getToDay().format('DD/MM/YYYY HH:mm:ss');
            user.lastServerId = serverId;
            user.lastServerAccessIp = ip;
            REPORT_CHANNEL.send('User: ' + username + ' with ip: ' + ip + ' has logged in at Server ' + serverId + '. Was updated.');
            console.log(TAG + ' - User: ' + username + ' with ip: ' + ip + ' has logged in at Server ' + serverId + '. Was updated.');
            datasource.updateUser(user);
        }
    })

    res.status(200).send();
});

app.get('/api/server-alive/:serverId', (req, res) => {
    const serverId = req.params.serverId;
    console.log(TAG + ' -  Server ' + serverId + ' is alive.');
    commons.serverStatus[parseInt(serverId) - 1].lastMessage = commons.getToDay();
    commons.serverStatus[parseInt(serverId) - 1].online = true;
    res.status(200).send();
});

app.get('/', async (req, res) =>{   
    let all = await datasource.getAllUsers();
    all = _.sortBy(all, [ u => { return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); }], ['asc']);
    res.status(200).render('user-list', {title: 'All users', users: all});
});

app.get('/magios', async (req, res) =>{
    const all = await datasource.getAllUsers();
    let magios = all.filter(u => u.roles && u.roles.find(r => r == 'Magios'));
    magios = _.sortBy(magios, [ u => { return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); }], ['asc']);

    res.status(200).render('user-list', {title: 'Magios', users: magios});
});

app.get('/newjoiners', async (req, res) =>{
    const all = await datasource.getAllUsers();
    let newJoiner = all.filter(u => u.roles && u.roles.find(r => r == 'NewJoiner'));
    newJoiner = _.sortBy(newJoiner, [ u => { return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); }], ['asc']);

    res.status(200).render('user-list', {title: 'NewJoiner', users: newJoiner});
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

    res.status(200).render('user-list', {title:'No role', users: norole});
});

app.get('/server-status', async (req, res) =>{
    const all = await datasource.getAllUsers();
    let norole = all.filter(u => !u.roles || u.roles == '');
    norole = _.sortBy(norole, [ u => { return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); }], ['asc']);

    res.status(200).render('server-status', {server1Status: serverStatus[0].online, server2Status: serverStatus[1].online});
});