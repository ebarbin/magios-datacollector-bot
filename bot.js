require('dotenv').config();
const express = require('express');
const { Client, Intents, MessageEmbed } = require('discord.js');

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

client.once('ready', () => { 
    DATABASE_CHANNEL = client.channels.cache.find(channel => channel.parent && channel.parent.name == 'ADMIN' && channel.name === DATABASE_CHANNEL_NAME);
    REPORT_CHANNEL = client.channels.cache.find(channel => channel.parent && channel.parent.name == 'ADMIN' && channel.name === REPORT_CHANNEL_NAME);
    DATABASE = getDataBase();
    console.log('Discord bot is connected.')     
});

client.on('voiceStateUpdate', (oldMember, newMember) => {

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
        
        let dataBaseUser = DATABASE.users.find(user => user.id == joinUser.id);

        if (!dataBaseUser) {
            
            let newUser = {
                id: joinUser.id,
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
    let result; 
    await DATABASE_CHANNEL.messages.fetch({ limit: 1 }).then(messages => {
        if (messages.size > 0) {
            let lastMessage = messages.first();
            result = JSON.parse(lastMessage.content);
        }
    }).catch();
    return result;
}


updateDateBase = () => {
    DATABASE_CHANNEL.send(JSON.stringify(DATABASE));
}

client.on('message', (message) => {

    try {
    
        if (message.author.bot) return;

        DATABASE = getDataBase();

        message.channel.fetch().then(channel => { 

            if (channel.parent.name != 'ADMIN' && channel.name != DATABASE_CHANNEL_NAME) {

                let dataBaseUser = DATABASE.users.find(user => user.id == message.author.id);

                if (!dataBaseUser) {

                    let newUser = {
                        id: message.author.id,
                        username: message.author.username,
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

                } else if (message.content == '!report') {

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
                    REPORT_CHANNEL.send(embed)
                }

                message.delete();
            }

        }).catch();

    } catch(e) {
        console.log('Error '+ e);
    }
});

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