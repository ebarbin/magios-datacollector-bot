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

const TEMPLATE = fs.readFileSync("template.html", "utf8");

const GUILD_ID = '628750110821449739';

let SERVER_STATUS_CHANNEL;
let EVENTOS_CALENDARIO_CHANNEL;
let REPORT_CHANNEL;
let GENERAL_CHANNEL;
let WELCOME_CHANNEL;
let GUILD;

client.login(process.env.DISCORD_BOT_TOKEN);

    client.once('ready', async () => {

        REPORT_CHANNEL = client.channels.cache.find(channel => channel.parent && channel.parent.name == 'ADMIN' && channel.name === 'report');
        WELCOME_CHANNEL = client.channels.cache.find(channel => channel.parent && channel.parent.name == 'Text Channels' && channel.name === 'welcome');
        GENERAL_CHANNEL = client.channels.cache.find(channel => channel.parent && channel.parent.name == 'Text Channels' && channel.name === 'general');
        EVENTOS_CALENDARIO_CHANNEL = client.channels.cache.find(channel => channel.parent && channel.parent.name == 'Text Channels' && channel.name === 'eventos-calendario');
        SERVER_STATUS_CHANNEL = client.channels.cache.find(channel => channel.parent && channel.parent.name == 'Server Data' && channel.name === 'server-status');

        GUILD = client.guilds.cache.find((g) => g.id === GUILD_ID );

        console.log(TAG + ' - Discord bot is connected.')

        await checkNewUserAndCreate();
        await checkLeftUsersAndRemove();
    });

if (common.ENABLE_DISCORD_EVENTS) {

    client.on('guildMemberRemove', async member => {
        const user = member.user;
        if (!user.bot) {
            let dataBaseUser = await datasource.getUser(user.id);
            if (dataBaseUser) {
                await datasource.removeUser(dataBaseUser);
                await sendMessageToReportChannel('The user "' + dataBaseUser.username + '" left the group.');
            }
        }
    });

    client.on('guildMemberAdd', async member => {
        const user = member.user;
        if (!user.bot) {
            let dataBaseUser = await datasource.getUser(user.id);
            if (!dataBaseUser) {
                const roles = getUserRoles(member);
                const newUser = common.createEmptyUser(member);
                newUser.roles = roles;
                newUser.joinDate = common.getToDay().format('DD/MM/YYYY HH:mm:ss');
                await datasource.saveUser(newUser);
                await sendMessageToReportChannel('The user "' + newUser.username + '" was created.');

                await member.user.send('Hola! ' + `${member}` + ' Bienvenido a Los Magios. Te pido que ingreses a este link para completar el proceso de ingreso al grupo: ' + process.env.APP_URL);
                await member.user.send('Si tenes alguna duda podes escribir en el canal ' + `${WELCOME_CHANNEL}` + '.');
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

        //const presence = await entryData.member.user.presence;
       // if (entryData.channel.parent.name == 'ADMIN') return;
        
        let dataBaseUser = await datasource.getUser(entryData.member.user.id);
        const roles = getUserRoles(entryData.member);

        if (dataBaseUser) {
            if (join) {
                dataBaseUser.avatar = entryData.member.user.avatar;
                dataBaseUser.joinVoiceChannelCount = parseInt(dataBaseUser.joinVoiceChannelCount) + 1
                dataBaseUser.lastVoiceChannelAccessDate = common.getToDay().format('DD/MM/YYYY HH:mm:ss');
                dataBaseUser.lastVoiceChannelName = entryData.channel.name;
            } else {
                const now = common.getToDay();
                const lastVoiceChannelAccessDate = moment(dataBaseUser.lastVoiceChannelAccessDate, 'DD/MM/YYYY HH:mm:ss');
                dataBaseUser.voiceChannelTotalTime = dataBaseUser.voiceChannelTotalTime + now.diff(lastVoiceChannelAccessDate, 'minutes');
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
            if (user /*&& user.roles && user.roles.find(r => r == 'Magios' || r == 'NewJoiner' || r == 'Admins')*/) {

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
                } else if (message.content == '!myterrains') {
                    const myterrains = [];
                    user.modules.forEach(m => {
                        if (_.includes(common.terrains, m)) myterrains.push(m);
                    });
                    if (myterrains.length > 0) message.reply(myterrains.join(', '));
                    else message.reply('No terrains added yet.');
                } else if (message.content == '!myjets') {
                    const jets = [];
                    user.modules.forEach(m => {
                        if (_.includes(common.jets, m)) jets.push(m);
                    });
                    if (jets.length > 0) message.reply(jets.join(', '));
                    else message.reply('No jets added yet.');
                }  else if (message.content == '!mywarbirds') {
                    const warbirds = [];
                    user.modules.forEach(m => {
                        if (_.includes(common.warbirds, m)) warbirds.push(m);
                    });
                    if (warbirds.length > 0) message.reply(warbirds.join(', '));
                    else message.reply('No warbirds added yet.');
                }  else if (message.content == '!myhelis') {
                    const helis = [];
                    user.modules.forEach(m => {
                        if (_.includes(common.helis, m)) helis.push(m);
                    });
                    if (helis.length > 0) message.reply(helis.join(', '));
                    else message.reply('No helis added yet.');
                }  else if (message.content == '!myothers') {
                    const others = [];
                    user.modules.forEach(m => {
                        if (_.includes(common.others, m)) others.push(m);
                    });
                    if (others.length > 0) message.reply(others.join(', '));
                    else message.reply('No others added yet.');
                } else if (message.content.indexOf('!addmodules') >= 0) {
                    const modules = message.content.split("!addmodules")[1].trim().split(",");
                    modules.forEach(async m => {
                        let mod = m.trim();
                        if (_.includes(user.modules, mod)) {
                            message.reply("Module already added.")  
                        } else {
                            if (_.includes(common.terrains, mod)) {
                                user.modules.push(mod);
                                await datasource.updateUser(user);
                                message.reply("Module added.");
                            } else if (_.includes(common.jets, mod)) {
                                user.modules.push(mod);
                                await datasource.updateUser(user);
                                message.reply("Module added.");
                            } else if (_.includes(common.warbirds, mod)) {
                                user.modules.push(mod);
                                await datasource.updateUser(user);
                                message.reply("Module added.");
                            } else if (_.includes(common.helis, mod)) {
                                user.modules.push(mod);
                                await datasource.updateUser(user);
                                message.reply("Module added.");
                            } else if (_.includes(common.others, mod)) {
                                user.modules.push(mod);
                                await datasource.updateUser(user);
                                message.reply("Module added.");
                            } else {
                                message.reply("Module " + mod + " not exists. Check module name using: \"!terrains, !jets, !warbirds, !helis, !others\" commands.");
                            }
                        }
                    });
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
                                message.reply("Module " + module + " not exists. Check module name using: \"!terrains, !jets, !warbirds, !helis, !others\" commands.");
                            }
                        }

                    } catch(e) {
                        message.reply("Fail adding module: " + module);
                    }
                } else if (message.content.indexOf('!removemodule') >= 0) {
                    try {
                        const module = message.content.split("!removemodule")[1].trim();
                        if (_.includes(user.modules, module)) {
                            user.modules = user.modules.filter(m => m !== module);
                            await datasource.updateUser(user);
                            message.reply("Module removed.");
                        } else {
                            message.reply("Fail removing module.");
                        }
                    } catch(e) {
                        message.reply("Fail removing module.");
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

            if (dataBaseUser) {
                dataBaseUser.avatar = message.author.avatar,
                dataBaseUser.msgChannelCount = parseInt(dataBaseUser.msgChannelCount) + 1
                dataBaseUser.lastTextChannelName = message.channel.name;
                dataBaseUser.lastTextChannelDate =  common.getToDay().format('DD/MM/YYYY HH:mm:ss');

                await datasource.updateUser(dataBaseUser);
            }

        } else if (message.channel.parent.name == 'ADMIN' && message.channel.name != 'admin-general') {

            if (message.content == '!delete') {

            } else if (message.content == '!clear') {

                const messages = await REPORT_CHANNEL.messages.fetch();
                messages.forEach(async ms => {
                    await ms.delete();
                })

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

checkLeftUsersAndRemove = () => {
    return new Promise(async (resolve, reject) => {
        const allUsers = await datasource.getAllUsers();
        let user;
        GUILD.members.fetch().then((members) => {
            members.forEach((member) => {
                allUsers.forEach(u => {
                    if (u.id == member.user.id) u.exists = true;
                })
            })
            const toRemove = allUsers.filter(u => !u.exists);
            toRemove.forEach(async u => {
                await datasource.removeUser(u);
                await sendMessageToReportChannel('The user "' + u.username + '" was removed.');
            })
            resolve();
        })
    })
}

checkNewUserAndCreate = () => { 
    return new Promise((resolve, reject) => {
        GUILD.members.fetch().then((members) => {
            members.forEach(async (member) => {
                if (!member.user.bot) {
                    const roles = getUserRoles(member);
                    const dbUser = await datasource.getUser(member.user.id);
                    if (!dbUser) {
                        const newUser = common.createEmptyUser(member);
                        newUser.roles = roles;
                        await datasource.saveUser(newUser);
                        await sendMessageToReportChannel('The user "' + newUser.username + '" was created.');
                    } else {
                        
                        if (dbUser.username != member.displayName.toLowerCase()) await notifyUsernameChangeOnGeneral(member, dbUser);
                             
                        dbUser.username = member.displayName.toLowerCase();
                        dbUser.roles = roles;
                        if (!dbUser.stats) {
                            dbUser.statsHistory = [];
                            dbUser.stats = [
                                { lastEvent: null, lastDate: null, takeoff:0, land: 0, kill: 0, crash: 0, hit: 0, shot: 0, dead: 0 },
                                { lastEvent: null, lastDate: null, takeoff:0, land: 0, kill: 0, crash: 0, hit: 0, shot: 0, dead: 0 },
                                { lastEvent: null, lastDate: null, takeoff:0, land: 0, kill: 0, crash: 0, hit: 0, shot: 0, dead: 0 }
                            ]
                        }
                        datasource.updateUser(dbUser);
                    }
                }
            })
            resolve();
        });
    })
}

notifyUsernameChangeOnGeneral = (member, user) => {
    return new Promise(async (resolve, reject) => {
        const adminsRol = GUILD.roles.cache.find(r => r.name == 'Admins');
        const newJoinerRol = GUILD.roles.cache.find(r => r.name == 'NewJoiner');
        const magiosRol = GUILD.roles.cache.find(r => r.name == 'Magios');
        await GENERAL_CHANNEL.send('Atención ' + `${adminsRol} ${newJoinerRol} ${magiosRol}` + ' el usuario anteriormente conocido como ' + _.camelCase(user.username) + ' ahora es ' + `${member}` + '.');
        resolve();
    })
}

notifyNewUserOnWelcome = (user) => {
    return new Promise(async (resolve, reject) => {
        const adminsRol = GUILD.roles.cache.find(r => r.name == 'Admins');
        const newJoinerRol = GUILD.roles.cache.find(r => r.name == 'NewJoiner');
        const magiosRol = GUILD.roles.cache.find(r => r.name == 'Magios');
        const members = await GUILD.members.fetch();
        const newMember = members.find(m => m.user.id == user.id);
        await WELCOME_CHANNEL.send('Atención ' + `${adminsRol} ${newJoinerRol} ${magiosRol}` + ' se ha unido al grupo ' + `${newMember}` + '.');
        await WELCOME_CHANNEL.send('Es de ' + user.country + ' y tiene estos módulos: ' + user.modules.join(', ') + '.');
        resolve();
    })
}

notifyLimboOrNonRoleUser = (user) => {
    return new Promise(async (resolve, reject) => {

        const members = await GUILD.members.fetch();
        const member = members.find(m => m.user.id == user.id);

        await member.user.send('Hola! ' + `${member}` + ' ¿como estás? Notamos que te has quedado en el canal de bienvenida. ¿Sigues interesado en formar parte de Los Magios?');
        await member.user.send('Para continuar el proceso de ingreso debes ingresar en el siguiente link y completar con tus datos. ' + process.env.APP_URL);
        await member.user.send('Si tenes alguna duda puedes escribir en el canal ' + `${WELCOME_CHANNEL}` + '.');

        resolve();
    })
}

sendMessageToGeneralChannel = (msg) => {
    return new Promise((resolve, reject) => {
        GENERAL_CHANNEL.send(msg).then(() => resolve());
    })
}

sendMessageToReportChannel = (msg) => {
    return new Promise((resolve, reject) => {
        REPORT_CHANNEL.send(msg).then(() => resolve());
    })
}

cleanServerStatus = () => {
    return new Promise(async (resolve, reject) => {
        const messages = await SERVER_STATUS_CHANNEL.messages.fetch({ limit: 100 });
        messages.forEach( async msg => await msg.delete() );
        resolve();
    })
}

notifyOwner = (server) => {
    return new Promise(async (resolve, reject) => {
        const allMembers = await GUILD.members.fetch();
        const ownerMember = allMembers.find(m => m.user.id == server.owner);
        await ownerMember.user.send('Server ' + server.id + ' is OFFLINE. Please check pick it up. Thanks!');
        await sendMessageToReportChannel('Server ' + server.id + ' is OFFLINE. The owner @' + ownerMember.displayName + ' was notified.');
        resolve();
    })
}

sendServerStatus = (server) => {
    return new Promise(async (resolve, reject) => {
        const embed = new MessageEmbed().setTimestamp();

        if (server.status) embed.setTitle('Servidor ' + server.id +': ONLINE').setColor('#00830b');
        else embed.setTitle('Servidor ' + server.id +': OFFLINE').setColor('#c90000');

        if (server.name && server.name != '') {
            embed.addFields({ name: 'Nombre', value: server.name, inline: false })
        }
        if (server.ip && server.ip != '') {
            embed.addFields({ name: 'Dirección IP', value: server.ip, inline: true })
        }
        if (server.password && server.password != '') {
            embed.addFields({ name: 'Contraseña', value: server.password, inline: true })
        }
        if (server.map && server.map != '') {
            embed.addFields({ name: 'Mapa', value: server.map, inline: true })
        }
        if (server.description && server.description != '') {
            embed.addFields({ name: 'Descripción', value: server.description, inline: false })
        }
        if (server.tacview && server.tacview != '') {
            embed.addFields({ name: 'Tacview link', value: server.tacview, inline: false })
        }
        if (server.others && server.others != '') {
            embed.addFields({ name: 'Otros', value: server.others, inline: false })
        }
        if (server.hours && server.hours != '') {
            embed.addFields({ name: 'Horarios', value: server.hours, inline: true })
        }
        if (server.srs != null) {
            embed.addFields({ name: 'SRS', value: server.srs ? 'Si': 'No', inline: true })
        }
        if (server.atis != null) {
            embed.addFields({ name: 'ATIS', value: server.atis ? 'Si': 'No', inline: true })
        }

        await SERVER_STATUS_CHANNEL.send(embed);
        console.log(TAG + ' - Server ' + server.id + ' status was reported to discord as ' + (server.status ? 'ONLINE.' : 'OFFLINE.'));
        resolve();
    })
}

registerUser = (user) => {
    return new Promise(async (resolve, reject) => {
        const allMembers = await GUILD.members.fetch();
        const member = allMembers.find(m => m.user.id == user.id);
        const limboRol = GUILD.roles.cache.find(r => r.name == 'Limbo');
        await member.roles.add(limboRol);
        resolve();
    })
}

cleanOldEvents = () => {
    return new Promise((resolve, reject) => {
        let quantity = 0;
        EVENTOS_CALENDARIO_CHANNEL.messages.fetch({ limit: 100 }).then(messages => {
            messages.forEach(async m => {
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
                            console.log('originalMsg ' + originalMsg);
                            console.log('embed ' + originalMsg);
                            const eventName = originalMsg.embeds[0].title.split(":calendar_spiral:")[1].trim().split('**')[1]
                            await sendMessageToReportChannel('The old event "' + eventName + '" was removed.');
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

exports.notifyNewUserOnWelcome = notifyNewUserOnWelcome;
exports.sendMessageToReportChannel = sendMessageToReportChannel;
exports.sendMessageToGeneralChannel = sendMessageToGeneralChannel;
exports.cleanOldEvents = cleanOldEvents;
exports.sendServerStatus = sendServerStatus;
exports.cleanServerStatus = cleanServerStatus;
exports.checkNewUserAndCreate = checkNewUserAndCreate;
exports.checkLeftUsersAndRemove = checkLeftUsersAndRemove;
exports.notifyOwner = notifyOwner;
exports.registerUser = registerUser;
exports.notifyLimboOrNonRoleUser = notifyLimboOrNonRoleUser;