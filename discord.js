require('dotenv').config();

const DiscordClient = require('discord.js').Client;
const MessageEmbed = require('discord.js').MessageEmbed;
const IntentsClient = require('discord.js').Intents;

const _ = require('lodash');
const pdf = require("pdf-creator-node");
const fs = require("fs");

const moment = require('moment-timezone');
const common = require('./common');
const datasource = require('./postgres');

const TAG = '[magios-datacollector-bot]';

const client = new DiscordClient({
    intents: [IntentsClient.FLAGS.GUILDS, IntentsClient.FLAGS.GUILD_MESSAGES, IntentsClient.FLAGS.GUILD_MESSAGE_REACTIONS]
});

const TEMPLATE = fs.readFileSync("assets/templates/template.html", "utf8");

const REPORT_CHANNEL_NAME = 'report';
const SERVER_STATUS_CHANNEL_NAME = 'server-status';
const EVENTOS_CALENDARIO_CHANNEL_NAME = 'eventos-calendario';

const ADMIN_GENERAL_CHANNEL_NAME = 'admin-general';
const GUILD_ID = '628750110821449739';

let SERVER_STATUS_CHANNEL;
let EVENTOS_CALENDARIO_CHANNEL;
let REPORT_CHANNEL;
let GUILD;

client.login(process.env.DISCORD_BOT_TOKEN);

    client.once('ready', async () => {
        REPORT_CHANNEL = client.channels.cache.find(channel => channel.parent && channel.parent.name == 'ADMIN' && channel.name === REPORT_CHANNEL_NAME);
        EVENTOS_CALENDARIO_CHANNEL = client.channels.cache.find(channel => channel.name === EVENTOS_CALENDARIO_CHANNEL_NAME);
        SERVER_STATUS_CHANNEL = client.channels.cache.find(channel => channel.parent && channel.parent.name == 'ADMIN' && channel.name === SERVER_STATUS_CHANNEL_NAME);
        GUILD = client.guilds.cache.find((g) => g.id === GUILD_ID );

        console.log(TAG + ' - Discord bot is connected.')

        await checkNewUserAtStartup();
    });

if (common.ENABLE_DISCORD_EVENTS) {

    client.on('guildMemberAdd', async member => {
        const user = member.user;
        if (!user.bot) {
            let dataBaseUser = await datasource.getUser(user.id);
            if (!dataBaseUser) {
                const roles = getUserRoles(member);
                const newUser = common.createEmptyUser(user);
                newUser.roles = roles;
                newUser.joinDate = common.getToDay().format('DD/MM/YYYY HH:mm:ss');
                await datasource.saveUser(newUser);
                sendMessageToReportChannel('The user "' + newUser.username + '" was created.');
            }
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
        
        let dataBaseUser = await datasource.getUser(entryData.member.user.id);
        const roles = getUserRoles(entryData.member);

        if (!dataBaseUser) {
                
            const newUser = common.createEmptyUser(entryData.member.user);
            newUser.roles = roles;

            if (join) {
                newUser.joinVoiceChannelCount = 1;
                newUser.lastVoiceChannelAccessDate = common.getToDay().format('DD/MM/YYYY HH:mm:ss')
                newUser.lastVoiceChannelName = entryData.channel.name;
            }

            await datasource.saveUser(newUser);

        } else {

            if (join) {
                dataBaseUser.avatar = entryData.member.user.avatar;
                dataBaseUser.joinVoiceChannelCount = parseInt(dataBaseUser.joinVoiceChannelCount) + 1
                dataBaseUser.lastVoiceChannelAccessDate = common.getToDay().format('DD/MM/YYYY HH:mm:ss');
                dataBaseUser.lastVoiceChannelName = entryData.channel.name;
            } else {
                const now = common.getToDay();
                const lastVoiceChannelAccessDate = moment(dataBaseUser.lastVoiceChannelAccessDate, 'DD/MM/YYYY HH:mm:ss');
                dataBaseUser.voiceChannelTotalTime = dataBaseUser.voiceChannelTotalTime + now.diff(lastVoiceChannelAccessDate, 'seconds');
                dataBaseUser.avatar = entryData.member.user.avatar;
            }
            
            dataBaseUser.roles = roles;
            await datasource.updateUser(dataBaseUser);
        }
    });

    client.on('message', async (message) => {   
        if (message.author.bot) return;
        
        if (message.channel.type == 'dm') {

            const user = await datasource.getUser(message.author.id);
            if (user && user.roles && user.roles.find(r => r == 'Magios' || r == 'NewJoiner' || r == 'Admins')) {

                if (message.content == '!terrains') {
                    message.reply(common.terrains.join(', '));
                } else if (message.content == '!jets') {
                    message.reply(common.jets.join(', '));
                } else if (message.content == '!warbirds') {
                    message.reply(common.warbirds.join(', '));
                } else if (message.content == '!helis') {
                    message.reply(common.helis.join(', '));
                } else if (message.content == '!others') {
                    message.reply(common.others.join(', '));
                } else if (message.content.indexOf('!addmodule') >= 0) {

                    try {
                        const module = message.content.split("!addmodule")[1].trim();
                        if (_.includes(user.modules, module)) {
                            message.reply("Module already added.");   
                        } else {
                            if (_.includes(common.terrains, module)) {
                                user.modules.push(module);
                                await datasource.updateUser(user);
                                message.reply("Module added.");
                            } else if (_.includes(common.jets, module)) {
                                user.modules.push(module);
                                await datasource.updateUser(user);
                                message.reply("Module added.");
                            } else if (_.includes(common.warbirds, module)) {
                                user.modules.push(module);
                                await datasource.updateUser(user);
                                message.reply("Module added.");
                            } else if (_.includes(common.helis, module)) {
                                user.modules.push(module);
                                await datasource.updateUser(user);
                                message.reply("Module added.");
                            } else if (_.includes(common.others, module)) {
                                user.modules.push(module);
                                await datasource.updateUser(user);
                                message.reply("Module added.");
                            } else {
                                message.reply("Module not exists. Check module name using: !terrains, !jets, !warbirds, !helis, !others");
                            }
                        }

                    } catch(e) {
                        message.reply("Fail adding module");
                    }

                } else if (message.content == '!limbo' && user.roles.find(r => r == 'Admins')) {

                    let users = await datasource.getAllUsers();
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
        
                } else if (message.content == '!newjoiner' && user.roles.find(r => r == 'Admins')) {

                    let users = await datasource.getAllUsers();
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
                } else if (message.content == '!magios' && user.roles.find(r => r == 'Admins')) {

                    let users = await datasource.getAllUsers();
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

                } else if (message.content.indexOf('!getid') >= 0 && user.roles.find(r => r == 'Admins')) {

                    const arr = message.content.split(' ');
                    if (arr.length == 2) {
                        const param = arr[1].trim();    
        
                        const uuser = await datasource.getUser(param);
        
                        if (uuser) {
                            let embed = new MessageEmbed()
                            .setTitle('Detalle usuario')
                            .setColor('#00830b')
                            .setTimestamp()
                            .setThumbnail(common.AVATAR_BASE_PATH + uuser.id + '/' + uuser.avatar + '.jpg');
                            
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

                } else if (message.content == '!download all' && user.roles.find(r => r == 'Admins')) {
                    
                    let users = await datasource.getAllUsers();

                    const document = {
                        html: TEMPLATE,
                        data: { users: users, title:'Reporte Todos' },
                        path: "./magios_report_all.pdf",
                        type: "",
                    };

                    pdf.create(document, common.exportsOptions).then((res) => {
                        message.channel.send({
                        files: [res.filename]
                        });
                    })
                    .catch((error) => {
                    console.error(error);
                    });

                } else if (message.content == '!download magios' && user.roles.find(r => r == 'Admins')) {
                    
                    let users = await datasource.getAllUsers();
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

                } else if (message.content == '!download limbo' && user.roles.find(r => r == 'Admins')) {
                    
                    let users = await datasource.getAllUsers();
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

                } else if (message.content == '!download newjoiner' && user.roles.find(r => r == 'Admins')) {
                    
                    let users = await datasource.getAllUsers();
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

            let dataBaseUser = await datasource.getUser(message.author.id);

            if (!dataBaseUser) {

                const newUser = common.createEmptyUser(joinUser);
                newUser.lastTextChannelName = message.channel.name;
                newUser.lastTextChannelDate = common.getToDay().format('DD/MM/YYYY HH:mm:ss');
                await datasource.saveUser(newUser);

            } else {
                dataBaseUser.avatar = message.author.avatar,
                dataBaseUser.msgChannelCount = parseInt(dataBaseUser.msgChannelCount) + 1
                dataBaseUser.lastTextChannelName = message.channel.name;
                dataBaseUser.lastTextChannelDate =  common.getToDay().format('DD/MM/YYYY HH:mm:ss');

                await datasource.updateUser(dataBaseUser);
            }

        } else if (message.channel.parent.name == 'ADMIN' && message.channel.name != ADMIN_GENERAL_CHANNEL_NAME) {

            if (message.content == '!delete') {

            } else if (message.content == '!clear') {

                REPORT_CHANNEL.messages.fetch().then(ms => { 
                    ms.forEach(msg => msg.delete() );
                }).catch();

            } else if (message.content == '!list') {

                let users = await datasource.getAllUsers();
                
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

                let users = await datasource.getAllUsers();
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

                let users = await datasource.getAllUsers();
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

                    const user = await datasource.getUser(param);

                    if (user) {
                        let embed = new MessageEmbed()
                        .setTitle('Detalle usuario')
                        .setColor('#00830b')
                        .setTimestamp()
                        .setThumbnail(common.AVATAR_BASE_PATH + user.id + '/' + user.avatar + '.jpg');
                        
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
            }

            message.delete();
        }
    });
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

checkNewUserAtStartup = () => { 
    return new Promise((resolve, reject) => {
        GUILD.members.fetch().then((members) => {
            members.forEach((member) => {
                if (!member.user.bot) {
                    const roles = getUserRoles(member);
                    datasource.getUser(member.user.id).then(dbUser => {
                        if (!dbUser) {
                            const newUser = common.createEmptyUser(member.user);
                            newUser.roles = roles;
                            datasource.saveUser(newUser);
                            sendMessageToReportChannel('The user "' + newUser.username + '" was created.');
                        } else {
                            dbUser.roles = roles;
                            datasource.updateUser(dbUser);
                        }
                    })
                }
            })
            resolve();
        });
    })
}

sendMessageToReportChannel = (msg) => {
    REPORT_CHANNEL.send(msg);
}

cleanServerStatus = () => {
    return new Promise((resolve, reject) => {
        SERVER_STATUS_CHANNEL.messages.fetch({ limit: 100 }).then(ms => { 
            ms.forEach(msg => msg.delete() );
            resolve();
        }).catch(() => reject());
    })
}

sendServerStatus = (server) => {
    return new Promise((resolve, reject) => {
        const embed = new MessageEmbed().setTimestamp();
        if (server.status) {
            embed.setTitle('Servidor ' + server.id +': ONLINE').setColor('#00830b');
        } else {
            embed.setTitle('Servidor ' + server.id +': OFFLINE').setColor('#c90000');
        }
        SERVER_STATUS_CHANNEL.send(embed);
        resolve();
    })
}

cleanOldEvents = () => {
    return new Promise((resolve, reject) => {
        let quantity = 0;
        EVENTOS_CALENDARIO_CHANNEL.messages.fetch({ limit: 100 }).then(messages => {
            messages.forEach(m => {
                if (m.author.bot && m.author.username == 'sesh' && m.embeds && m.embeds.length > 0) {
                    const embed = m.embeds[0];
                    if (embed.title.indexOf('is starting now!') >= 0) {
                        const msgId = embed.description.split('/')[embed.description.split('/').length-1].split(')**')[0];
                        const originalMsg = m.channel.messages.cache.find(msg => msg.id == msgId);
                        const msgDate = moment(m.createdAt);
                        const rightNow = common.getToDay();
                        if (rightNow.diff(msgDate, 'hours') >= 24) {
                            quantity++;
                            m.delete();
                            if (originalMsg) {
                                originalMsg.delete();  
                            }
                            const eventName = originalMsg.title.split(":calendar_spiral:")[1].trim().split('**')[1];
                            sendMessageToReportChannel('The event "' + eventName + '" was removed.');
                        }
                    }
                }
            })
            resolve(quantity);
        }).catch(err => {
            reject(err);
        });
    });
}

exports.sendMessageToReportChannel = sendMessageToReportChannel;
exports.cleanOldEvents = cleanOldEvents;
exports.sendServerStatus = sendServerStatus;
exports.cleanServerStatus = cleanServerStatus;
exports.checkNewUserAtStartup = checkNewUserAtStartup;