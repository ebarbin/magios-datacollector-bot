require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const _ = require('lodash');
const moment = require('moment');

const pdf = require("pdf-creator-node");
const fs = require("fs");
const TEMPLATE = fs.readFileSync("assets/template.html", "utf8");

const DiscordClient = require('discord.js').Client;
const MessageEmbed = require('discord.js').MessageEmbed;
const IntentsClient = require('discord.js').Intents;
const PostgresClient = require('pg').Client;

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const postgresClient = new PostgresClient({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
    ssl: true
});

const options = {
    format: "A4",
    orientation: "portrait",
    border: "10mm",
    header: {
        height: "10mm",
        contents: '<div style="font-size:small; text-align: right;">Los Magios</div>'
    },
    footer: {
        height: "10mm",
        contents: {
            default: '<div style="text-align: right;color: #444;">{{page}}</span>/<span>{{pages}}</div>',
        }
    }
};

const client = new DiscordClient({
    intents: [IntentsClient.FLAGS.GUILDS, IntentsClient.FLAGS.GUILD_MESSAGES, IntentsClient.FLAGS.GUILD_MESSAGE_REACTIONS]
});

const REPORT_CHANNEL_NAME = 'report';
const EVENTOS_CALENDARIO_CHANNEL_NAME = 'eventos-calendario';

const ADMIN_GENERAL_CHANNEL_NAME = 'admin-general';
const GUILD_ID = '628750110821449739';
const AVATAR_BASE_PATH = 'https://cdn.discordapp.com/avatars/';

let ADMIN_GENERAL_CHANNEL;
let EVENTOS_CALENDARIO_CHANNEL;
let REPORT_CHANNEL;
let GUILD;

client.login(process.env.DISCORD_BOT_TOKEN);

client.once('ready', async () => { 
    REPORT_CHANNEL = client.channels.cache.find(channel => channel.parent && channel.parent.name == 'ADMIN' && channel.name === REPORT_CHANNEL_NAME);
    EVENTOS_CALENDARIO_CHANNEL = client.channels.cache.find(channel => channel.name === EVENTOS_CALENDARIO_CHANNEL_NAME);

    GUILD = client.guilds.cache.find((g) => g.id === GUILD_ID );

    console.log('Discord bot is connected.')
    postgresClient.connect();

    checkNewUserAtStartup();
});

client.on('guildMemberAdd', async member => {
    const user = member.user;
    let dataBaseUser = await getUser(user.id);
    if (!dataBaseUser) {
        const roles = getUserRoles(member);
        const newUser = createEmptyUser(user);
        newUser.roles = roles;
        newUser.joinDate = moment().format('DD/MM/YYYY HH:mm:ss');
        await saveUser(newUser);
    }
});

client.on('voiceStateUpdate', async (oldMember, newMember) => {
    let join = true;

    let entryData;
    if (newMember.channel) {
        entryData = newMember;
        join = true;
    } else {
        entryData = oldMember;
        join = false;
    }

    if (entryData.channel.parent.name == 'ADMIN') return;
    
    let dataBaseUser = await getUser(entryData.member.user.id);
    const roles = getUserRoles(entryData.member);

    if (!dataBaseUser) {
            
        const newUser = createEmptyUser(entryData.member.user);
        newUser.roles = roles;

        if (join) {
            newUser.joinVoiceChannelCount = 1;
            newUser.lastVoiceChannelAccessDate = moment().format('DD/MM/YYYY HH:mm:ss')
            newUser.lastVoiceChannelName = entryData.channel.name;
        }

        await saveUser(newUser);

    } else {

        if (join) {
            dataBaseUser.avatar = entryData.member.user.avatar;
            dataBaseUser.joinVoiceChannelCount = parseInt(dataBaseUser.joinVoiceChannelCount) + 1
            dataBaseUser.lastVoiceChannelAccessDate = moment().format('DD/MM/YYYY HH:mm:ss');
            dataBaseUser.lastVoiceChannelName = entryData.channel.name;
        } else {
            const now = moment(new Date(), 'DD/MM/YYYY HH:mm:ss');
            const lastVoiceChannelAccessDate = moment(dataBaseUser.lastVoiceChannelAccessDate, 'DD/MM/YYYY HH:mm:ss');
            dataBaseUser.voiceChannelTotalTime = dataBaseUser.voiceChannelTotalTime + now.diff(lastVoiceChannelAccessDate, 'seconds');
            dataBaseUser.avatar = entryData.member.user.avatar;
        }
        
        dataBaseUser.roles = roles;
        await updateUser(dataBaseUser);
    }
 });

client.on('message', async (message) => {   
    if (message.author.bot) return;
    
    if (message.channel.type == 'dm') {

        const user = await getUser(message.author.id);
        if (user && user.roles && user.roles.find(r => r == 'Admins')) {

            if (message.content == '!limbo') {

                let users = await getAllUsers();
                users = users.filter(u => u.roles && u.roles.find(r => r == 'Limbo'));
                users = _.sortBy(users, [ u => {
                    return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); 
                }], ['asc']);
                
                const pageSize = 3;
                const pages = Math.round((users.length +1)/ pageSize);
    
                for (let i = 1; i <= pages; i++) {
                    
                    let paginatedUsers = paginate(users, pageSize, i);
    
                    let embed = new MessageEmbed()
                        .setTitle('Roles Limbo - ' + i + ' de ' + pages)
                        .setColor('#00830b')
                        .setTimestamp();
    
                        paginatedUsers.forEach(user => {
                    
                            embed.addFields(
                                { name: '--> ' + user.username, value: '('+user.id+')', inline: false },
                                { name: 'Rol/es', value: user.roles ? user.roles.join(',') : '-', inline: true },
                                { name: 'Ingreso', value: user.joinDate ? user.joinDate : '-', inline: true },
                                { name: 'Ultimo mensaje', value: user.lastTextChannelDate || '-', inline: true })
                        })
                        message.channel.send(embed);
                }
    
            } else if (message.content == '!newjoiner') {

                let users = await getAllUsers();
                users = users.filter(u => u.roles && u.roles.find(r => r == 'NewJoiner'));
                users = _.sortBy(users, [ u => {
                    return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); 
                }], ['asc']);
                
                const pageSize = 3;
                const pages = Math.round((users.length +1)/ pageSize);
    
                for (let i = 1; i <= pages; i++) {
                    
                    let paginatedUsers = paginate(users, pageSize, i);
    
                    let embed = new MessageEmbed()
                        .setTitle('Roles NewJoiner - ' + i + ' de ' + pages)
                        .setColor('#00830b')
                        .setTimestamp();
    
                        paginatedUsers.forEach(user => {
                    
                            embed.addFields(
                                { name: '--> ' + user.username, value: '('+user.id+')', inline: false },
                                { name: 'Rol/es', value: user.roles ? user.roles.join(',') : '-', inline: true },
                                { name: 'Ingreso', value: user.joinDate ? user.joinDate : '-', inline: true },
                                { name: 'Ultimo mensaje', value: user.lastTextChannelDate || '-', inline: true })
                        })
                        message.channel.send(embed);
                }
            } else if (message.content == '!magios') {

                let users = await getAllUsers();
                users = users.filter(u => u.roles && u.roles.find(r => r == 'Magios'));
                users = _.sortBy(users, [ u => {
                    return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); 
                }], ['asc']);
                
                const pageSize = 3;
                const pages = Math.round((users.length +1)/ pageSize);
    
                for (let i = 1; i <= pages; i++) {
                    
                    let paginatedUsers = paginate(users, pageSize, i);
    
                    let embed = new MessageEmbed()
                        .setTitle('Roles Magios - ' + i + ' de ' + pages)
                        .setColor('#00830b')
                        .setTimestamp();
    
                        paginatedUsers.forEach(user => {
                    
                            embed.addFields(
                                { name: '--> ' + user.username, value: '('+user.id+')', inline: false },
                                { name: 'Rol/es', value: user.roles ? user.roles.join(',') : '-', inline: true },
                                { name: 'Ingreso', value: user.joinDate ? user.joinDate : '-', inline: true },
                                { name: 'Ultimo mensaje', value: user.lastTextChannelDate || '-', inline: true })
                        })
                        message.channel.send(embed);
                }

            } else if (message.content.indexOf('!getid') >= 0) {

                const arr = message.content.split(' ');
                if (arr.length == 2) {
                    const param = arr[1].trim();    
    
                    const uuser = await getUser(param);
    
                    if (uuser) {
                        let embed = new MessageEmbed()
                        .setTitle('Detalle usuario')
                        .setColor('#00830b')
                        .setTimestamp()
                        .setThumbnail(AVATAR_BASE_PATH + uuser.id + '/' + uuser.avatar + '.jpg');
                        
                        embed.addFields(
                            { name: uuser.username, value:'('+uuser.id+')', inline: false },
                            { name: '1. Canal audio (seg.)', value: uuser.voiceChannelTotalTime || 0, inline: true },
                            { name: '2. Ingresos audio (cant.)', value: uuser.joinVoiceChannelCount || 0, inline: true },
                            { name: '3. Ultimo acceso audio (fec.)', value: uuser.lastVoiceChannelAccess || '-', inline: true },
                            { name: '4. Canal audio', value: uuser.lastVoiceChannelName || '-', inline: true },
                            { name: '5. Mensajes (cant.)', value: uuser.msgChannelCount || 0, inline: true },
                            { name: '6. Canal texto', value: uuser.lastTextChannelName || '-', inline: true },
                            { name: '7. Ultimo mensaje (fec.)', value: uuser.lastTextChannelDate || '-', inline: true },
                            { name: 'Ingreso (fec.)', value: uuser.joinDate ? uuser.joinDate : '-', inline: false }
                            )
                    
                        message.channel.send(embed);
                    }
                }

            } else if (message.content == '!download all') {
                
                let users = await getAllUsers();

                const document = {
                    html: TEMPLATE,
                    data: { users: users, title:'Reporte Todos' },
                    path: "./magios_report_all.pdf",
                    type: "",
                };

                pdf.create(document, options).then((res) => {
                    message.channel.send({
                      files: [res.filename]
                    });
                })
                .catch((error) => {
                  console.error(error);
                });

            } else if (message.content == '!download magios') {
                
                let users = await getAllUsers();
                users = users.filter(user => user.roles && user.roles.find(r => r == 'Magios'));
                users = _.sortBy(users, [ u => {
                    return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); 
                }], ['asc']);

                const document = {
                    html: TEMPLATE,
                    data: { users: users, title:'Reporte Magios' },
                    path: "./magios_report_magios.pdf",
                    type: "",
                };

                pdf.create(document, options).then((res) => {
                    message.channel.send({
                      files: [res.filename]
                    });
                })
                .catch((error) => {
                  console.error(error);
                });

            } else if (message.content == '!download limbo') {
                
                let users = await getAllUsers();
                users = users.filter(user => user.roles && user.roles.find(r => r == 'Limbo'));
                users = _.sortBy(users, [ u => {
                    return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); 
                }], ['asc']);

                const document = {
                    html: TEMPLATE,
                    data: { users: users, title:'Reporte Limbo' },
                    path: "./magios_report_limbo.pdf",
                    type: "",
                };

                pdf.create(document, options).then((res) => {
                    message.channel.send({
                      files: [res.filename]
                    });
                })
                .catch((error) => {
                  console.error(error);
                });

            } else if (message.content == '!download newjoiner') {
                
                let users = await getAllUsers();
                users = users.filter(user => user.roles && user.roles.find(r => r == 'NewJoiner'));
                users = _.sortBy(users, [ u => {
                    return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); 
                }], ['asc']);

                const document = {
                    html: TEMPLATE,
                    data: { users: users, title:'Reporte NewJoiner'},
                    path: "./magios_report_newjoiner.pdf",
                    type: "",
                };

                pdf.create(document, options).then((res) => {
                    message.channel.send({
                      files: [res.filename]
                    });
                })
                .catch((error) => {
                  console.error(error);
                });
            }
            
        }

    } else if (message.channel.parent.name != 'ADMIN') {

        let dataBaseUser = await getUser(message.author.id);

        if (!dataBaseUser) {

            const newUser = createEmptyUser(joinUser);
            newUser.lastTextChannelName = message.channel.name;
            newUser.lastTextChannelDate = moment().format('DD/MM/YYYY HH:mm:ss');
            await saveUser(newUser);

        } else {
            dataBaseUser.avatar = message.author.avatar,
            dataBaseUser.msgChannelCount = parseInt(dataBaseUser.msgChannelCount) + 1
            dataBaseUser.lastTextChannelName = message.channel.name;
            dataBaseUser.lastTextChannelDate =  moment().format('DD/MM/YYYY HH:mm:ss');

            await updateUser(dataBaseUser);
        }

    } else if (message.channel.parent.name == 'ADMIN' && message.channel.name != ADMIN_GENERAL_CHANNEL_NAME) {

        if (message.content == '!delete') {

        } else if (message.content == '!clear') {

            REPORT_CHANNEL.messages.fetch().then(ms => { 
                ms.forEach(msg => msg.delete() );
            }).catch();

        } else if (message.content == '!list') {

            let users = await getAllUsers();
            
            const pageSize = 3;
            const pages = Math.round((users.length +1)/ pageSize);

            for (let i = 1; i <= pages; i++) {
                
                let paginatedUsers = paginate(users, pageSize, i);

                let embed = new MessageEmbed()
                    .setTitle('Reporte de actividad ' + i + ' de ' + pages)
                    .setColor('#00830b')
                    .setTimestamp();

                    paginatedUsers.forEach(user => {
                
                        embed.addFields(
                            { name: '--> ' + user.username, value: '('+user.id+')', inline: false },
                            { name: 'Rol/es', value: user.roles ? user.roles.join(',') : '-', inline: true },
                            { name: 'Ingreso', value: user.joinDate ? user.joinDate : '-', inline: true },
                            { name: 'Ultimo mensaje', value: user.lastTextChannelDate || '-', inline: true })
                    })
                    REPORT_CHANNEL.send(embed);
            }

        } else if (message.content == '!limbo') {

            let users = await getAllUsers();
            users = users.filter(user => user.roles && user.roles.find(r => r == 'Limbo'));
            users = _.sortBy(users, [ u => {
                return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); 
            }], ['asc']);
            
            const pageSize = 3;
            const pages = Math.round((users.length +1)/ pageSize);

            for (let i = 1; i <= pages; i++) {
                
                let paginatedUsers = paginate(users, pageSize, i);

                let embed = new MessageEmbed()
                    .setTitle('Roles Limbo - ' + i + ' de ' + pages)
                    .setColor('#00830b')
                    .setTimestamp();

                    paginatedUsers.forEach(user => {
                
                        embed.addFields(
                            { name: '--> ' + user.username, value: '('+user.id+')', inline: false },
                            { name: 'Rol/es', value: user.roles ? user.roles.join(',') : '-', inline: true },
                            { name: 'Ingreso', value: user.joinDate ? user.joinDate : '-', inline: true },
                            { name: 'Ultimo mensaje', value: user.lastTextChannelDate || '-', inline: true })
                    })
                    REPORT_CHANNEL.send(embed);
            }

        } else if (message.content == '!newjoiner') {

            let users = await getAllUsers();
            users = users.filter(user => user.roles && user.roles.find(r => r == 'NewJoiner'));
            users = _.sortBy(users, [ u => {
                return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); 
            }], ['asc']);
            
            const pageSize = 3;
            const pages = Math.round((users.length +1)/ pageSize);

            for (let i = 1; i <= pages; i++) {
                
                let paginatedUsers = paginate(users, pageSize, i);

                let embed = new MessageEmbed()
                    .setTitle('Roles NewJoiner - ' + i + ' de ' + pages)
                    .setColor('#00830b')
                    .setTimestamp();

                    paginatedUsers.forEach(user => {
                
                        embed.addFields(
                            { name: '--> ' + user.username, value: '('+user.id+')', inline: false },
                            { name: 'Rol/es', value: user.roles ? user.roles.join(',') : '-', inline: true },
                            { name: 'Ingreso', value: user.joinDate ? user.joinDate : '-', inline: true },
                            { name: 'Ultimo mensaje', value: user.lastTextChannelDate || '-', inline: true })
                    })
                    REPORT_CHANNEL.send(embed);
            }

        } else if (message.content.indexOf('!getid') >= 0) {

            const arr = message.content.split(' ');
            if (arr.length == 2) {
                const param = arr[1].trim();    

                const user = await getUser(param);

                if (user) {
                    let embed = new MessageEmbed()
                    .setTitle('Detalle usuario')
                    .setColor('#00830b')
                    .setTimestamp()
                    .setThumbnail(AVATAR_BASE_PATH + user.id + '/' + user.avatar + '.jpg');
                    
                    embed.addFields(
                        { name: user.username, value:'('+user.id+')', inline: false },
                        { name: '1. Canal audio (seg.)', value: user.voiceChannelTotalTime || 0, inline: true },
                        { name: '2. Ingresos audio (cant.)', value: user.joinVoiceChannelCount || 0, inline: true },
                        { name: '3. Ultimo acceso audio (fec.)', value: user.lastVoiceChannelAccess || '-', inline: true },
                        { name: '4. Canal audio', value: user.lastVoiceChannelName || '-', inline: true },
                        { name: '5. Mensajes (cant.)', value: user.msgChannelCount || 0, inline: true },
                        { name: '6. Canal texto', value: user.lastTextChannelName || '-', inline: true },
                        { name: '7. Ultimo mensaje (fec.)', value: user.lastTextChannelDate || '-', inline: true },
                        { name: 'Ingreso (fec.)', value: user.joinDate ? user.joinDate : '-', inline: false }
                        )
                
                    REPORT_CHANNEL.send(embed);
                }
            }

        } else if (message.content.indexOf('!setval') >= 0) {
            /*
            const arr = message.content.split(' ');
            if (arr.length == 4) {
                const paramId = arr[1].trim();
                const prop = Number(arr[2].trim());
                const val = arr[3].trim();

                let user = await getUser(paramId);

                if (user) {

                    if (!isNaN(prop)) {
                        switch(prop) {
                            case 1:
                                if (!isNaN(val)) {
                                    user.voiceChannelTotalTime = val;
                                }
                                break;
                            case 2:
                                if (!isNaN(val)) {
                                    user.joinVoiceChannelCount = val;
                                }
                            break;
                            case 3:
                                if (val.length == 19) {
                                    user.joinVoiceChannelCount = moment(val, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY HH:mm:ss');
                                }
                            break;
                            case 4:
                                if (val.length > 0) {
                                    user.lastVoiceChannelName = val;
                                }
                            break;
                            case 5:
                                if (!isNaN(val)) {
                                    user.msgChannelCount = val;
                                }
                            break;
                            case 6:
                                if (val.length > 0) {
                                    user.lastTextChannelName = val;
                                }
                            break
                            case 7:
                                if (val.length == 19) {
                                    user.lastTextChannelDate = moment(val, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY HH:mm:ss');
                                }
                            break;
                        }
                    }

                    await updateUser(user);
                }
            }*/
        }

        message.delete();
    }
});

cron.schedule('*/1440 * * * *', () => {
    console.log('running a task every 24hs hours');
    EVENTOS_CALENDARIO_CHANNEL.messages.fetch({ limit: 100 }).then(messages => {
        messages.forEach(m => {
            if (m.author.bot && m.author.username == 'sesh' && m.embeds && m.embeds.length > 0) {
                const embed = m.embeds[0];
                if (embed.title.indexOf('is starting now!') >= 0) {
                    const msgId = embed.description.split('/')[embed.description.split('/').length-1].split(')**')[0];
                    const originalMsg = m.channel.messages.cache.find(msg => msg.id == msgId);
                    const msgDate = moment(m.createdAt);
                    const rightNow = moment();
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

checkNewUserAtStartup = () => { 
    GUILD.members.fetch().then((members) =>
        members.forEach((member) => {
            if (!member.user.bot) {
                const roles = getUserRoles(member);
                getUser(member.user.id).then(dbUser => {
                    if (!dbUser) {
                        const newUser = createEmptyUser(member.user);
                        newUser.roles = roles;
                        saveUser(newUser);
                    } else {
                        dbUser.roles = roles;
                        updateUser(dbUser);
                    }
                })
            }
        })
    );
}

getUserRoles = (member) => {
    const roles = [];
    member.roles.cache.forEach(role => {
        let rol = GUILD.roles.cache.find(r => r.id == role.id)
        if (rol.name != '@everyone') {
            roles.push(rol.name);
        }
    });
    return roles;
}

createEmptyUser = (user) => {
    return {
        id: user.id,
        avatar: user.avatar,
        username: user.username,
        voiceChannelTotalTime: 0,
        joinVoiceChannelCount: 0,
        msgChannelCount: 0,
        lastVoiceChannelAccessDate: null,
        lastVoiceChannelName: null,
        lastTextChannelName: null,
        lastTextChannelDate: null,
        modules: []
    }
}

updateUser = async (user) => {
    const query = { text: 'UPDATE magios2 SET username = $2, data = $3 WHERE id = $1', values: [user.id, user.username, JSON.stringify(user)] };
    const res = await postgresClient.query(query);
 }

 saveUser = async (user) => { 
    const query = { text: 'INSERT INTO magios2 (id, username, data) VALUES($1, $2, $3)', values: [user.id, user.username, JSON.stringify(user)] };
    const res = await postgresClient.query(query);
 } 

 findUserByUsername = async (username) => {
    try {
        const query =  { text: 'SELECT * FROM magios2 WHERE username like $1', values: ['%' + username + '%'] };
        const res = await postgresClient.query(query)
        if (res.rows.length > 0) {
            return JSON.parse(res.rows[0].data);
        } else {
            return null;
        }
      } catch (err) {
      }
 }

 getUser = async (userId) => { 
    try {
        const query =  { text: 'SELECT * FROM magios2 WHERE id = $1', values: [userId] };
        const res = await postgresClient.query(query)
        if (res.rows.length > 0) {
            return JSON.parse(res.rows[0].data);
        } else {
            return null;
        }
      } catch (err) {
      }
}

getAllUsers = async () => {
    try {
        const query =  { text: 'SELECT * FROM magios2' };
        const res = await postgresClient.query(query);
        const result = [];
        if (res.rows.length > 0) {
            for(let i = 0; i < res.rows.length; i++) {
                result.push(JSON.parse(res.rows[i].data));
            }
        }
        return result;
      } catch (err) {
      }
}

createDataBase = async () => { 
    const res = await postgresClient.query('CREATE TABLE magios2 (id TEXT, data TEXT)');
}

paginate = (array, page_size, page_number) => {
    return array.slice((page_number - 1) * page_size, page_number * page_size);
}

const PORT = process.env.PORT || 3000;
const app = express();

app.use(bodyParser.json());

app.listen(PORT, () => {
    console.log(`App is running on port ${ PORT }`);
});

app.get('/:id', (req, res) =>{
    console.log(req.params);
    res.status(200).send();
})

app.post('/user-join-server', (req, res) => {

    const username = req.body.username;
    const strDate = req.body.date;
    const serverId = req.body.serverId;
    const ip = req.body.ip;

    findUserByUsername(username).then(user => {
        if (!user) {
            REPORT_CHANNEL.send('Unknow user: ' + username + ' with ip: ' + ip + ' has logged in at Server ' + serverId + '.')
            console.log('Username: ' + username + ' not exist!');
        } else {
            user.lastServerAccess = moment(strDate, 'DD-MM-YYYY HH:mm.sss').format('DD/MM/YYYY HH:mm:ss');
            user.lastServerId = serverId;
            user.lastServerAccessIp = ip;
            updateUser(user);
        }
    })

    res.status(200).send();
})