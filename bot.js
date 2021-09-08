require('dotenv').config();
const express = require('express');
const cron = require('node-cron');

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
})

const _ = require('lodash');
const moment = require('moment');

const client = new DiscordClient({
    intents: [IntentsClient.FLAGS.GUILDS, IntentsClient.FLAGS.GUILD_MESSAGES, IntentsClient.FLAGS.GUILD_MESSAGE_REACTIONS]
});

const REPORT_CHANNEL_NAME = 'report';
const ADMIN_GENERAL_CHANNEL_NAME = 'admin-general';

let REPORT_CHANNEL;

client.login(process.env.DISCORD_BOT_TOKEN);

client.once('ready', async () => { 
    REPORT_CHANNEL = client.channels.cache.find(channel => channel.parent && channel.parent.name == 'ADMIN' && channel.name === REPORT_CHANNEL_NAME);
    console.log('Discord bot is connected.')
    postgresClient.connect();
});

client.on('guildMemberAdd', async member => {
    const user = member.user;
    let dataBaseUser = await getUser(user.id);
    if (!dataBaseUser) {
        const newUser = {
            id: user.id,
            joinDate: moment().format('DD/MM/YYYY HH:mm:ss'),
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
        };
        await saveUser(newUser);
    }
});

client.on('voiceStateUpdate', async (oldMember, newMember) => {
    let join = true;
    let joinUser = null;
    let channelName = null;

    if (newMember.channel) {
        join = true;
        joinUser = newMember.member.user;
        channelName = newMember.channel.name;

        if (newMember.channel.parent.name == 'ADMIN') return;

    } else {
        join = false;
        joinUser = oldMember.member.user;
        channelName = oldMember.channel.name;
        
        if (oldMember.channel.parent.name == 'ADMIN') return;
    }
    
    let dataBaseUser = await getUser(joinUser.id);
    
    if (!dataBaseUser) {
        
        let newUser = {
            id: joinUser.id,
            joinDate: moment().format('DD/MM/YYYY HH:mm:ss'),
            avatar: joinUser.avatar,
            username: joinUser.username,
            voiceChannelTotalTime: 0,
            joinVoiceChannelCount: 0,
            msgChannelCount: 0,
            lastVoiceChannelAccessDate: null,
            lastVoiceChannelName: null,
            lastTextChannelName: null,
            lastTextChannelDate: null,
            modules: []
        };

        if (join) {
            newUser.joinVoiceChannelCount = 1;
            newUser.lastVoiceChannelAccessDate = moment().format('DD/MM/YYYY HH:mm:ss')
            newUser.lastVoiceChannelName = channelName;
        }

        await saveUser(newUser);

    } else {

        if (join) {
            dataBaseUser.avatar = joinUser.avatar;
            dataBaseUser.joinVoiceChannelCount = parseInt(dataBaseUser.joinVoiceChannelCount) + 1
            dataBaseUser.lastVoiceChannelAccessDate = moment().format('DD/MM/YYYY HH:mm:ss');
            dataBaseUser.lastVoiceChannelName = channelName;
        } else {
            const now = moment(new Date(), 'DD/MM/YYYY HH:mm:ss');
            const lastVoiceChannelAccessDate = moment(dataBaseUser.lastVoiceChannelAccessDate, 'DD/MM/YYYY HH:mm:ss');
            dataBaseUser.voiceChannelTotalTime = dataBaseUser.voiceChannelTotalTime + now.diff(lastVoiceChannelAccessDate, 'seconds');
            dataBaseUser.avatar = joinUser.avatar;
        }

        await updateUser(dataBaseUser);
    }
 });

client.on('message', async (message) => {   
    if (message.author.bot) return;
    
    if (message.channel.type == 'dm') {
/*
        let dataBaseUser = await getUser(message.author.id);

        if (!dataBaseUser) {
            let newUser = {
                id: message.author.id,
                username: message.author.username,
                avatar: message.author.avatar,
                voiceChannelTotalTime: 0,
                joinVoiceChannelCount: 0,
                msgChannelCount: 0,
                lastVoiceChannelAccessDate: null,
                lastVoiceChannelName: null,
                lastTextChannelName: channel.name,
                lastTextChannelDate: moment().format('DD/MM/YYYY HH:mm:ss'),
                modules: []
            };
            DATABASE.users.push(newUser);
            dataBaseUser = newUser;
        }

        if (message.content.indexOf('!add') >= 0) {
            const values = message.content.split(' ');
            if (values.length == 2) {
                if (!dataBaseUser.modules) {
                    dataBaseUser.modules = [values[1]];
                    updateDateBase();
                } else if (dataBaseUser.modules.find(module => module == values[1])) {
                    dataBaseUser.modules.push(values[1]);
                    updateDateBase();
                }
            }
        }*/

        } else if (message.channel.parent.name != 'ADMIN') {

        let dataBaseUser = await getUser(message.author.id);

        if (!dataBaseUser) {

            let newUser = {
                id: message.author.id,
                joinDate: moment().format('DD/MM/YYYY HH:mm:ss'),
                username: message.author.username,
                avatar: message.author.avatar,
                voiceChannelTotalTime: 0,
                joinVoiceChannelCount: 0,
                msgChannelCount: 0,
                lastVoiceChannelAccessDate: null,
                lastVoiceChannelName: null,
                lastTextChannelName: message.channel.name,
                lastTextChannelDate: moment().format('DD/MM/YYYY HH:mm:ss'),
                modules: []
            };
    
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
            
            users = users.map(u => {
                u.lastTextChannelDate = moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss');
                return u;
            })
            users = _.orderBy(users, 'lastTextChannelDate', 'desc');

            for (let i = 1; i <= pages; i++) {
                
                let paginatedUsers = paginate(users, pageSize, i);

                let embed = new MessageEmbed()
                    .setTitle('Reporte de actividad ' + i + ' de ' + pages)
                    .setColor('#00830b')
                    .setTimestamp();

                    paginatedUsers.forEach(user => {
                
                        embed.addFields(
                                { name: '------------------', value: 'Usuario: '+ user.username + ' ('+user.id+')', inline: false },
                                { name: '1. Tiempo en canal audio', value: user.voiceChannelTotalTime || 0, inline: true },
                                { name: '2. Cant. ingresos canal audio', value: user.joinVoiceChannelCount || 0, inline: true },
                                { name: '3. Ultimo acceso canal audio', value: user.lastVoiceChannelAccess || '-', inline: true },
                                { name: '4. Nom. ultimo canal de audio', value: user.lastVoiceChannelName || '-', inline: true },
                                { name: '5. Cant. de msg.', value: user.msgChannelCount || 0, inline: true },
                                { name: '6. Nom. ultimo canal de texto', value: user.lastTextChannelName || '-', inline: true },
                                { name: '7. Fecha de ultimo mensaje', value: user.lastTextChannelDate.format('DD/MM/YYYY HH:mm:ss') || '-', inline: true }
                            )
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
                    .setThumbnail('https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.jpg');
                    
                    embed.addFields(
                            { name: '------------------------------------------', value: 'Usuario: '+ user.username + ' ('+user.id+')', inline: false },
                            { name: '1. Tiempo en canal audio', value: user.voiceChannelTotalTime || 0, inline: true },
                            { name: '2. Cant. ingresos canal audio', value: user.joinVoiceChannelCount || 0, inline: true },
                            { name: '3. Ultimo acceso canal audio', value: user.lastVoiceChannelAccess || '-', inline: true },
                            { name: '4. Nom. ultimo canal de audio', value: user.lastVoiceChannelName || '-', inline: true },
                            { name: '5. Cant. de msg.', value: user.msgChannelCount || 0, inline: true },
                            { name: '6. Nom. ultimo canal de texto', value: user.lastTextChannelName || '-', inline: true },
                            { name: '7. Fecha de ultimo mensaje', value: user.lastTextChannelDate || '-', inline: true }
                        )
                
                    REPORT_CHANNEL.send(embed);
                }
            }

        } else if (message.content.indexOf('!setval') >= 0) {

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
            }
        }

        message.delete();
    }
});

cron.schedule('*/2 * * * *', () => {
    console.log('running a task every two minutes');
});

updateUser = async (user) => {
    const query = { text: 'UPDATE magios2 SET data = $2 WHERE id = $1', values: [user.id, JSON.stringify(user)] };
    const res = await postgresClient.query(query);
 }

 saveUser = async (user) => { 
    const query = { text: 'INSERT INTO magios2 (id, data) VALUES($1, $2)', values: [user.id, JSON.stringify(user)] };
    const res = await postgresClient.query(query);
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
app.listen(PORT, () => {
    console.log(`App is running on port ${ PORT }`);
});

