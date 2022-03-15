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

client.login(process.env.DISCORD_BOT_TOKEN);

client.once('ready', async () => {
    console.log(TAG + ' - Discord bot is connected.')
});

if (process.env.environment != 'dev') {

    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (!newMember.user.bot) {
            const user = await datasource.getUser(newMember.user.id);
            const roles = getUserRoles(newMember);
    
            if (oldMember.displayName != newMember.displayName) {
                await notifyUsernameChangeOnGeneral(oldMember, newMember);
            }
    
            if (user) {
                user.username = newMember.displayName.toLowerCase();
                user.roles = roles;
                await datasource.updateUser(user);
            } else {
                const newUser = common.createEmptyUser(newMember);
                newUser.roles = roles;
                newUser.joinDate = common.getToDay().format('DD/MM/YYYY HH:mm:ss');
                await datasource.saveUser(newUser);
            }
        }
    });

    client.on('guildMemberRemove', async member => {
        if (!member.user.bot) {
            let user = await datasource.getUser(member.user.id);
            if (user) {
                await datasource.removeUser(user);
                await notifyUserLeftGroupOnGeneral(member);
                await sendMessageToLogDiscordChannel('The user "' + user.username + '" was removed.');
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
                await sendMessageToLogDiscordChannel('The user "' + newUser.username + '" was created.');

                await member.user.send('Hola! ' + `${member}` + ' Bienvenido a Los Magios. Te pido que ingreses a este link para completar el proceso de ingreso al grupo: ' + process.env.APP_URL);
                await member.user.send('Si tenes alguna duda podes escribir en el canal ' + `${getWelcomeChannel()}` + '.');
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
                
                } else if (message.content.indexOf('!help') >= 0) {

                    let embed = new MessageEmbed().setTitle('Ayuda').setColor('#00830b').setTimestamp();
                    embed.addFields(
                        { name: '!terrains', value: 'List all terrains.', inline: false },
                        { name: '!jets', value: 'List all jets.', inline: true },
                        { name: '!warbirds', value: 'List all warbirds.', inline: true },
                        { name: '!helis', value: 'List all helis.', inline: true },
                        { name: '!others', value: 'List all others.', inline: true },
                        { name: '!myterrains', value: 'List my terrains.', inline: true },
                        { name: '!myjets', value: 'List my jets.', inline: true },
                        { name: '!mywarbirds', value: 'List my warbirds.', inline: true },
                        { name: '!myhelis', value: 'List my helis.', inline: true },
                        { name: '!myothers', value: 'List my others.', inline: true },

                        { name: '!limbo', value: 'List all limbos.', inline: true },
                        { name: '!newjoiner', value: 'List all newjoiners.', inline: true },
                        { name: '!magios', value: 'List all magios.', inline: true },

                        { name: '!addmodules <param>', value: 'Add list of modules comma separated.', inline: true },
                        { name: '!addmodule <param>', value: 'Add module.', inline: true },
                        { name: '!removemodule <param>', value: 'Remove module.', inline: true },
                        { name: '!allwithmodule <param>', value: 'List of users with module.', inline: true },
                    );
                    
                    message.channel.send(embed);

                } else {

                    if (user.roles.find(r => r == 'Admins')) {

                        if (message.content.indexOf('!allwithmodule') >= 0) {

                            const module = message.content.split("!allwithmodule")[1].trim();
                            let users = await datasource.getAllUsers();
                            users = users.filter(u => u.modules && u.modules.find(m => m == module));
                            message.channel.send(users.map(u => u.username).join());

                        } else if (message.content == '!limbo' || message.content == '!newjoiner' || message.content == '!magios') {

                            let role;

                            if (message.content == '!limbo') {
                                role = 'Limbo';
                            } else if (message.content == '!newjoiner') {
                                role = 'NewJoiner';
                            } else if (message.content == '!magios') {
                                role = 'Magios';
                            }

                            let users = await datasource.getAllUsers();
                            users = users.filter(u => u.roles && u.roles.find(r => r == role));
                            users = _.sortBy(users, [ u => {
                                return !u.lastTextChannelDate || moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss').toDate(); 
                            }], ['asc']);
                            
                            const pageSize = 3;
                            const pages = Math.round((users.length +1)/ pageSize);
                
                            for (let i = 1; i <= pages; i++) {
                                
                                let paginatedUsers = paginate(users, pageSize, i);
                
                                let embed = new MessageEmbed()
                                    .setTitle('Roles '+role+' - ' + i + ' de ' + pages)
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

                        } else if (message.content == '!download all') {
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

                        } else if (message.content == '!download magios') {
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

                        } else if (message.content == '!download limbo') {
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

                        } else if (message.content == '!download newjoiner') {

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

                const messages = await getReportChannel().messages.fetch();
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
                        getReportChannel().send(embed);
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
                        getReportChannel().send(embed);
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
                        getReportChannel().send(embed);
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
                        );
                    
                        getReportChannel().send(embed);
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
        let rol = getGuild().roles.cache.find(r => r.id == role.id)
        if (rol.name != '@everyone') {
            roles.push(rol.name);
        }
    });
    return roles;
}

checkLeftUsersAndRemove = () => {
    return new Promise(async (resolve, reject) => {
        const allUsers = await datasource.getAllUsers();
        getGuild().members.fetch().then((members) => {
            members.forEach((member) => {
                allUsers.forEach(u => {
                    if (u.id == member.user.id) u.exists = true;
                })
            })
            const toRemove = allUsers.filter(u => !u.exists);
            toRemove.forEach(async u => {
                await datasource.removeUser(u);
                await sendMessageToLogDiscordChannel('The user "' + u.username + '" was removed.');
            })
            resolve();
        })
    })
}

checkNewUserAndCreate = () => { 
    return new Promise((resolve, reject) => {
        getGuild().members.fetch().then((members) => {
            members.forEach(async (member) => {
                if (!member.user.bot) {
                    const roles = getUserRoles(member);
                    const dbUser = await datasource.getUser(member.user.id);
                    if (!dbUser) {
                        const newUser = common.createEmptyUser(member);
                        newUser.roles = roles;
                        await datasource.saveUser(newUser);
                        await sendMessageToLogDiscordChannel('The user "' + newUser.username + '" was created.');
                    } else {
                        
                       // if (dbUser.username != member.displayName.toLowerCase()) await notifyUsernameChangeOnGeneral(member, dbUser);
                             
                        dbUser.username = member.displayName.toLowerCase();
                        dbUser.roles = roles;
                        if (!dbUser.events) dbUser.events = [];
                        datasource.updateUser(dbUser);
                    }
                }
            })
            resolve();
        });
    })
}

notifyUsernameChangeOnGeneral = (oldMember, newMember) => {
    return new Promise(async (resolve, reject) => {
        const adminsRol = getGuild().roles.cache.find(r => r.name == 'Admins');
        const newJoinerRol = getGuild().roles.cache.find(r => r.name == 'NewJoiner');
        const magiosRol = getGuild().roles.cache.find(r => r.name == 'Magios');
        await getGeneralChannel().send('Atención ' + `${adminsRol} ${newJoinerRol} ${magiosRol}` + ' el usuario "' + oldMember.displayName + '" ha cambiado su nombre por ' + `${newMember}` + '.');
        await getlogDiscordChannel().send('Atención el usuario "' + oldMember.displayName + '" ha cambiado su nombre por ' + `${newMember}` + '.');
        resolve();
    })
}

notifyUserLeftGroupOnGeneral = (member) => {
    return new Promise(async (resolve, reject) => {
        const adminsRol = getGuild().roles.cache.find(r => r.name == 'Admins');
        const newJoinerRol = getGuild().roles.cache.find(r => r.name == 'NewJoiner');
        const magiosRol = getGuild().roles.cache.find(r => r.name == 'Magios');
        await getGeneralChannel().send('Atención ' + `${adminsRol} ${newJoinerRol} ${magiosRol}` + ' el usuario "' + `${member}` + '" (' + member.displayName + ') ha abandonado el grupo.');
        resolve();
    })
}

notifyNewUserOnWelcome = (user) => {
    return new Promise(async (resolve, reject) => {
        const adminsRol = getGuild().roles.cache.find(r => r.name == 'Admins');
        const newJoinerRol = getGuild().roles.cache.find(r => r.name == 'NewJoiner');
        const magiosRol = getGuild().roles.cache.find(r => r.name == 'Magios');
        const members = await getGuild().members.fetch();
        const newMember = members.find(m => m.user.id == user.id);
        await getWelcomeChannel().send('Atención ' + `${adminsRol} ${newJoinerRol} ${magiosRol}` + ' se ha unido al grupo ' + `${newMember}` + '.');
        if (user.modules.length == 0) {
            await getWelcomeChannel().send('Es de ' + user.country + '.');
        } else {
            await getWelcomeChannel().send('Es de ' + user.country + ' y tiene estos módulos: ' + user.modules.join(', ') + '.');
        }
        resolve();
    })
}

notifyLimboOrNonRoleUser = (user) => {
    return new Promise(async (resolve, reject) => {

        const members = await getGuild().members.fetch();
        const member = members.find(m => m.user.id == user.id);

        if (member) {
            await member.user.send('Hola! ' + `${member}` + ' ¿como estás? Notamos que te has quedado en el canal de bienvenida. ¿Sigues interesado en formar parte de Los Magios?');
            await member.user.send('Para continuar el proceso de ingreso debes ingresar en el siguiente link y completar con tus datos. ' + process.env.APP_URL);
            await member.user.send('Si tenes alguna duda puedes escribir en el canal ' + `${getWelcomeChannel()}` + '.');
        }

        resolve();
    })
}

notifyUsers = (user) => {
    return new Promise(async (resolve, reject) => {

        const members = await getGuild().members.fetch();
        const member = members.find(m => m.user.id == user.id);

        if (member) {
            await member.user.send('Hola! ' + `${member}` + ' ¿como estás? Notamos que hace tiempo que no te pasas por los canales. Esperamos que andes muy bien y ya sabes que puedes pasar cuando quieras :).');
        }

        resolve();
    })
}

sendMessageToGeneralChannel = (msg) => {
    return new Promise((resolve, reject) => {
        getGeneralChannel().send(msg).then(() => resolve());
    })
}

sendMessageToReportChannel = (msg) => {
    return new Promise((resolve, reject) => {
        getReportChannel().send(msg).then(() => resolve());
    })
}

getReportChannel = () => {
    return client.channels.cache.find(channel => channel.parent && channel.parent.name == 'ADMIN' && channel.name === 'report');
}

getlogDiscordChannel = () => {
    return client.channels.cache.find(channel => channel.parent && channel.parent.name == 'ADMIN' && channel.name === 'log-discord');
}

getlogDcsChannel = () => {
    return client.channels.cache.find(channel => channel.parent && channel.parent.name == 'ADMIN' && channel.name === 'log-dcs');
}

getWelcomeChannel = () => {
    return client.channels.cache.find(channel => channel.parent && channel.parent.name == 'Text Channels' && channel.name === 'welcome');
}

getGeneralChannel = () => {
    return client.channels.cache.find(channel => channel.parent && channel.parent.name == 'Text Channels' && channel.name === 'general');
}

getEventosCalendarioChannel = () => {
    return client.channels.cache.find(channel => channel.parent && channel.parent.name == 'Text Channels' && channel.name === 'eventos-calendario');
}

getServerStatusChannel = () => {
    return client.channels.cache.find(channel => channel.parent && channel.parent.name == 'Server Data' && channel.name === 'server-status');
}

getGuild = () => {
    return client.guilds.cache.find((g) => g.id === process.env.GUILD_ID );
}

sendMessageToDcsChannel = (msg) => {
    return new Promise((resolve, reject) => {
        getlogDcsChannel().send(msg).then(() => resolve());
    })
}

sendMessageToLogDiscordChannel = (msg) => {
    return new Promise((resolve, reject) => {
        getlogDiscordChannel().send(msg).then(() => resolve());
    })
}

cleanServerStatus = () => {
    return new Promise(async (resolve, reject) => {
        const messages = await getServerStatusChannel().messages.fetch({ limit: 100 });
        messages.forEach( async msg => await msg.delete() );
        resolve();
    })
}

notifyOwner = (server) => {
    return new Promise(async (resolve, reject) => {
        const allMembers = await getGuild().members.fetch();
        const ownerMember = allMembers.find(m => m.user.id == server.owner);
        await ownerMember.user.send(+ `${ownerMember}` + ': Server ' + server.id + ' is OFFLINE. Please check pick it up. Thanks!');
        await sendMessageToLogDiscordChannel('Server ' + server.id + ' is OFFLINE. The owner @' + ownerMember.displayName + ' was notified.');
        resolve();
    })
}

sendServerStatus = (server) => {
    return new Promise(async (resolve, reject) => {
        const embed = new MessageEmbed().setTimestamp();

        const lastOnline = moment(server.updated, 'YYYY-MM-DD HH:mm:ss.SSS').format('DD/MM/YYYY HH:mm:ss')

        if (server.status) embed.setTitle('Servidor ' + server.id +': ONLINE').setColor('#00830b');
        else embed.setTitle('Servidor ' + server.id +': OFFLINE (' + lastOnline + ')').setColor('#c90000');

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
        if (server.owner != null) {
            const owner = await datasource.getUser(server.owner);
            embed.addFields({ name: 'Dueño', value: owner.username, inline: true })
        }
        
        embed.addFields({ name: 'Evitar notificación', value: server.skipnotification ? 'Si': 'No', inline: true })

        await getServerStatusChannel().send(embed);
        console.log(TAG + ' - Server ' + server.id + ' status was reported to discord as ' + (server.status ? 'ONLINE.' : 'OFFLINE.'));
        resolve();
    })
}

registerUser = (user) => {
    return new Promise(async (resolve, reject) => {
        const allMembers = await getGuild().members.fetch();
        const member = allMembers.find(m => m.user.id == user.id);
        const limboRol = getGuild().roles.cache.find(r => r.name == 'Limbo');
        await member.roles.add(limboRol);
        resolve();
    })
}

cleanOldEvents = () => {
    return new Promise((resolve, reject) => {
        let quantity = 0;
        getEventosCalendarioChannel().messages.fetch({ limit: 100 }).then(messages => {
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
                            await sendMessageToLogDiscordChannel('The old event "' + eventName + '" was removed.');
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

paginate = (data, pageSize, page) => {
    return _.take(_.drop(data, pageSize * (page - 1)), pageSize)
}

exports.notifyNewUserOnWelcome = notifyNewUserOnWelcome;
exports.sendMessageToReportChannel = sendMessageToReportChannel;
exports.sendMessageToLogDiscordChannel = sendMessageToLogDiscordChannel;
exports.sendMessageToDcsChannel = sendMessageToDcsChannel;
exports.sendMessageToGeneralChannel = sendMessageToGeneralChannel;
exports.cleanOldEvents = cleanOldEvents;
exports.sendServerStatus = sendServerStatus;
exports.cleanServerStatus = cleanServerStatus;
exports.notifyOwner = notifyOwner;
exports.registerUser = registerUser;
exports.notifyLimboOrNonRoleUser = notifyLimboOrNonRoleUser;
exports.notifyUsers = notifyUsers;
