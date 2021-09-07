require('dotenv').config();
const express = require('express');
const { Client, Intents, MessageEmbed } = require('discord.js');

const _ = require('lodash');
const moment = require('moment');

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});

const DATABASE_CHANNEL_NAME = 'database';
const REPORT_CHANNEL_NAME = 'report';

let DATABASE_CHANNEL;
let REPORT_CHANNEL;

let DATABASE = {users:[]};

client.login(process.env.DISCORD_BOT_TOKEN);

client.once('ready', async () => { 
    DATABASE_CHANNEL = client.channels.cache.find(channel => channel.parent && channel.parent.name == 'ADMIN' && channel.name === DATABASE_CHANNEL_NAME);
    REPORT_CHANNEL = client.channels.cache.find(channel => channel.parent && channel.parent.name == 'ADMIN' && channel.name === REPORT_CHANNEL_NAME);

    await getDataBase();
    console.log('Discord bot is connected.')     
});

client.on('voiceStateUpdate', async (oldMember, newMember) => {

    try {

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
        
        await getDataBase();

        let dataBaseUser = DATABASE.users.find(user => user.id == joinUser.id);

        if (!dataBaseUser) {
            
            let newUser = {
                id: joinUser.id,
                avatar: 'https://cdn.discordapp.com/avatars/' + joinUser.id + '/' + joinUser.avatar + '.jpg',
                username: joinUser.username,
                voiceChannelTotalTime: 0,
                joinVoiceChannelCount: 0,
                msgChannelCount: 0,
                lastVoiceChannelAccessDate: null,
                lastVoiceChannelName: null,
                lastTextChannelName: null,
                lastTextChannelDate: null
            };

            if (join) {
                newUser.joinVoiceChannelCount = 1;
                newUser.lastVoiceChannelAccessDate = moment().format('DD/MM/YYYY HH:mm:ss')
                newUser.lastVoiceChannelName = channelName;
            }

            DATABASE.users.push(newUser);

        } else {

            if (join) {
                dataBaseUser.joinVoiceChannelCount = parseInt(dataBaseUser.joinVoiceChannelCount) + 1
                dataBaseUser.lastVoiceChannelAccessDate = moment().format('DD/MM/YYYY HH:mm:ss');
                dataBaseUser.lastVoiceChannelName = channelName;
            } else {
                const now = moment(new Date(), 'DD/MM/YYYY HH:mm:ss');
                const lastVoiceChannelAccessDate = moment(dataBaseUser.lastVoiceChannelAccessDate, 'DD/MM/YYYY HH:mm:ss');
                dataBaseUser.voiceChannelTotalTime = dataBaseUser.voiceChannelTotalTime + now.diff(lastVoiceChannelAccessDate, 'seconds');
            }
        }

        updateDateBase();

    } catch(e) {
        console.log('Error '+ e);
    }
 });

getDataBase = async () => { 
    await DATABASE_CHANNEL.messages.fetch({ limit: 1 }).then(messages => {
        if (messages.size > 0) {
            let lastMessage = messages.first();
            DATABASE = JSON.parse(lastMessage.content);
        }
    }).catch();
}

updateDateBase = () => {
    DATABASE_CHANNEL.send(JSON.stringify(DATABASE));
}

client.on('message', async (message) => {

    try {
    
        if (message.author.bot) return;

        await getDataBase();

        message.channel.fetch().then(channel => { 

            if (channel.parent.name != 'ADMIN' && channel.name != DATABASE_CHANNEL_NAME) {

                let dataBaseUser = DATABASE.users.find(user => user.id == message.author.id);

                if (!dataBaseUser) {

                    let newUser = {
                        id: message.author.id,
                        username: message.author.username,
                        avatar: 'https://cdn.discordapp.com/avatars/' + joinUser.id + '/' + joinUser.avatar + '.jpg',
                        voiceChannelTotalTime: 0,
                        joinVoiceChannelCount: 0,
                        msgChannelCount: 0,
                        lastVoiceChannelAccessDate: null,
                        lastVoiceChannelName: null,
                        lastTextChannelName: channel.name,
                        lastTextChannelDate: moment().format('DD/MM/YYYY HH:mm:ss')
                    };
            
                    DATABASE.users.push(newUser);

                } else {
                    dataBaseUser.msgChannelCount = parseInt(dataBaseUser.msgChannelCount) + 1
                    dataBaseUser.lastTextChannelName = channel.name;
                    dataBaseUser.lastTextChannelDate =  moment().format('DD/MM/YYYY HH:mm:ss');
                }

                updateDateBase();

            } else if (channel.parent.name == 'ADMIN') {

                if (message.content == '!delete') {

                    DATABASE_CHANNEL.messages.fetch().then(ms => { 
                        ms.forEach(msg => msg.delete() );
                    }).catch();

                    DATABASE = {users:[]};

                } else if (message.content == '!clear') {

                    REPORT_CHANNEL.messages.fetch().then(ms => { 
                        ms.forEach(msg => msg.delete() );
                    }).catch();

                } else if (message.content == '!list') {

                    const pageSize = 3;
                    const pages = Math.round((DATABASE.users.length + 1) / pageSize);
                    
                    let auxData = DATABASE.users.map(u => {
                        u.lastTextChannelDate = moment(u.lastTextChannelDate, 'DD/MM/YYYY HH:mm:ss');
                        return u;
                    })
                    auxData = _.orderBy(auxData, 'lastTextChannelDate', 'desc');

                    for (let i = 1; i <= pages; i++) {
                        
                        let paginateData = paginate(auxData, pageSize, i);

                        let embed = new MessageEmbed()
                            .setTitle('Reporte de actividad ' + i + ' de ' + pages)
                            .setColor('#00830b')
                            .setTimestamp();

                            paginateData.forEach(user => {
                        
                                embed.addFields(
                                        { name: '------------------', value: 'Usuario: '+ user.username + ' ('+user.id+')', inline: false },
                                        { name: 'Tiempo en canal audio', value: user.voiceChannelTotalTime || '-', inline: true },
                                        { name: 'Cant. ingresos canal audio', value: user.joinVoiceChannelCount || '-', inline: true },
                                        { name: 'Ultimo acceso canal audio', value: user.lastVoiceChannelAccess || '-', inline: true },
                                        { name: 'Nom. ultimo canal de audio', value: user.lastVoiceChannelName || '-', inline: true },
                                        { name: 'Cant. de msg.', value: user.msgChannelCount || '-', inline: true },
                                        { name: 'Nom. ultimo canal de texto', value: user.lastTextChannelName || '-', inline: true },
                                        { name: 'Fecha de ultimo mensaje', value: user.lastTextChannelDate.format('DD/MM/YYYY HH:mm:ss') || '-', inline: true }
                                    )
                            })
                            REPORT_CHANNEL.send(embed);
                    }

                } else if (message.content.indexOf('!getid') >= 0) {

                    const arr = message.content.split('!getid');
                    if (arr.length == 2) {
                        const param = arr[1].trim();
                        console.log(param)
                        const user = DATABASE.users.find(u => u.id == param );
                        console.log(user);
                        if (user) {
                            let embed = new MessageEmbed()
                            .setTitle('Detalle usuario')
                            .setColor('#00830b')
                            .setTimestamp()
                            .setThumbnail(user.avatar);
                            
                            embed.addFields(
                                    { name: '------------------------------------------', value: 'Usuario: '+ user.username, inline: false },
                                    { name: 'Tiempo en canal audio', value: user.voiceChannelTotalTime || 'Sin datos', inline: true },
                                    { name: 'Cant. ingresos canal audio', value: user.joinVoiceChannelCount || 'Sin datos', inline: true },
                                    { name: 'Ultimo acceso canal audio', value: user.lastVoiceChannelAccess || 'Sin datos', inline: true },
                                    { name: 'Nom. ultimo canal de audio', value: user.lastVoiceChannelName || 'Sin datos', inline: true },
                                    { name: 'Cant. de msg.', value: user.msgChannelCount || 'Sin datos', inline: true },
                                    { name: 'Nom. ultimo canal de texto', value: user.lastTextChannelName || 'Sin datos', inline: true },
                                    { name: 'Fecha de ultimo mensaje', value: user.lastTextChannelDate || 'Sin datos', inline: true }
                                )
                        
                            REPORT_CHANNEL.send(embed);
                        }
                    }
                }

                message.delete();
            }

        }).catch();

    } catch(e) {
        console.log('Error '+ e);
    }
});

function paginate(array, page_size, page_number) {
    // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
    return array.slice((page_number - 1) * page_size, page_number * page_size);
}

/*cron.schedule('* * * * *', async () => {
    
    await getDataBase();
    
    REPORT_CHANNEL.messages.fetch().then(messages => { 

        messages.forEach(msg => msg.delete());

        if (DATABASE.users.length > 0) {

            let embed = new MessageEmbed()
                   .setTitle('Reporte de actividad')
                   .setDescription('Reporte buchon magio!')
                   .setColor('#00830b')
                   .setTimestamp();

            DATABASE.users.forEach(user => {
                
                embed.addFields(
                       { name: '------------------------------------------', value: 'Usuario: '+ user.username, inline: false },
                       { name: 'Tiempo en canal audio', value: user.voiceChannelTotalTime || 'Sin datos', inline: true },
                       { name: 'Cant. ingresos canal audio', value: user.joinVoiceChannelCount || 'Sin datos', inline: true },
                       { name: 'Ultimo acceso canal audio', value: user.lastVoiceChannelAccess || 'Sin datos', inline: true },
                       { name: 'Nom. ultimo canal de audio', value: user.lastVoiceChannelName || 'Sin datos', inline: true },
                       { name: 'Cant. de msg.', value: user.msgChannelCount || 'Sin datos', inline: true },
                       { name: 'Nom. ultimo canal de texto', value: user.lastVoiceChannelName || 'Sin datos', inline: true },
                       { name: 'Fecha de ultimo mensaje', value: user.lastTextChannelDate || 'Sin datos', inline: true }
                   )
           })
           REPORT_CHANNEL.send(embed);
          
        }


    });


});*/

const PORT = process.env.PORT || 3000;
const app = express();
app.listen(PORT, () => {
    console.log(`App is running on port ${ PORT }`);
});















        //DATABASE_CHANNEL.send(message.author.username + " en el canal "+channel.name+" escribio: " + message.content);

        //Clear all messages
        //message.messages.fetch().then(messages => { messages.forEach(msg => msg.delete()) });

       /* if (channel.name == WELCOME_CHANNEL_NAME) {

            if (message.author.username != 'sesh') {

                message.delete();

                console.log(message.content);
                switch(message.content) {
                    case '!start': 
                        channel.send("!poll [Jets ?] MIG-15bis, C-101, JF-17, M-2000C, F-14, AJS37, MB-339, AV-8B, MIG-21bis, MIG-19");
                        setTimeout(() => channel.send("Type !morejets to continue") , 1000);
                    break;
                    case '!morejets':
                        channel.send("!poll [Jets cont.?] A-10C, A-10CII, F/A-18C, F-16C, F-5E, F-86F, L-39, Flaming Cliffs");
                        setTimeout(() => channel.send("Type !terrains to continue or !end to finish") , 1000);
                        break;
                    case '!terrains':
                        channel.send("!poll [Terrains?] Persian Gulf, Syria, Channel, Normandy 1944, Nevada");
                        setTimeout(() => channel.send("Type !warbirds to continue or !end to finish") , 1000);
                        break;
                    case '!warbirds':
                        channel.send("!poll [Warbirds?] BF-109K, FW-190A, FW-190D, P-47, Spitfire MKIX, P-51, Mosquito, I-16");
                        setTimeout(() => channel.send("Type !helicopters to continue !end to finish") , 1000);
                        break;
                    case '!helicopters':
                        channel.send("!poll [Helicopters?] AH-64D, MI-24P, Ka-50, Mi-8MTV2, UH-1H, SA-342");
                        setTimeout(() => channel.send("Type !others to continue !end to finish") , 1000);
                        break;
                    case '!Others':
                        channel.send("!poll [Others?] CA, Supercarrier, NS-430, Christen Eagle II, YAK-52, WWII Asset Pack");
                        setTimeout(() => channel.send("Type !end to enter to Los Magios") , 1000);
                        break;
                    default: 
                        message.reply('El comando: <' + message.content + '> no es valido, para continuar debes ingresar: !continue')
                        .then(msg => {
                        setTimeout(() => msg.delete(), 5000)
                        })
                        .catch();
                        break;
                }

            } else {
                
            }

        }*/