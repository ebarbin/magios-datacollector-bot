require('dotenv').config();
const express = require('express');
const { Client, Intents } = require('discord.js');
const moment = require('moment');

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});

const DATABASE_CHANNEL_NAME = 'database';
let DATABASE_CHANNEL;
let DATABASE = {users:[]};

client.login(process.env.DISCORD_BOT_TOKEN);

client.once('ready', () => { 
    DATABASE_CHANNEL = client.channels.cache.find(channel => channel.name === DATABASE_CHANNEL_NAME);
    console.log('Discord bot is connected.') 
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

    await getDataBase();

    let dataBaseUser = DATABASE.users.find(user => user.id == joinUser.id);

    if (!dataBaseUser) {
        
        let newUser = {
            id: joinUser.id,
            username: joinUser.username,
            voiceChannelTotalTime: 0,
            joinVoiceChannelCount: 0,
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
            dataBaseUser.joinVoiceChannelCount++;
            dataBaseUser.lastVoiceChannelAccessDate = moment().format('DD/MM/YYYY HH:mm:ss');
            dataBaseUser.lastVoiceChannelName = channelName;
        } else {
            const now = moment();
            const lastVoiceChannelAccessDate = moment(dataBaseUser.lastVoiceChannelAccessDate, 'DD/MM/YYYY HH:mm:ss');
            dataBaseUser.voiceChannelTotalTime = dataBaseUser.voiceChannelTotalTime + now.diff(lastVoiceChannelAccessDate, 'seconds');
        }
    }

    updateDateBase();
 });


getDataBase = async () => {
    await DATABASE_CHANNEL.messages.fetch({ limit: 1 }).then(messages => {
        if (messages.size > 0) {
            let lastMessage = messages.first();
            lastMessage.delete();
            DATABASE = JSON.parse(lastMessage.content);
        }
    })
}


updateDateBase = async () => {
    DATABASE_CHANNEL.send(JSON.stringify(DATABASE));
}

client.on('message', async (message) => {

    if (message.author.bot) return;
    
    message.channel.fetch().then(channel => { 

        if (channel.parent.name != 'ADMIN' && channel.name != DATABASE_CHANNEL_NAME) {

            await getDataBase();
            
            let dataBaseUser = DATABASE.users.find(user => user.id == message.author.id);

            if (!dataBaseUser) {

                let newUser = {
                    id: message.author.id,
                    username: message.author.username,
                    voiceChannelTotalTime: 0,
                    joinVoiceChannelCount: 0,
                    lastVoiceChannelAccessDate: null,
                    lastVoiceChannelName: null,
                    lastTextChannelName: channel.name,
                    lastTextChannelDate: moment().format('DD/MM/YYYY HH:mm:ss')
                };
        
                DATABASE.users.push(newUser);

            } else {
                dataBaseUser.lastTextChannelName = channel.name;
                dataBaseUser.lastTextChannelDate =  moment().format('DD/MM/YYYY HH:mm:ss');
            }

            updateDateBase();
        }

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
        
        
    })


});

const PORT = process.env.PORT || 3000;
const app = express();
app.listen(PORT, () => {
    console.log(`App is running on port ${ PORT }`);
});