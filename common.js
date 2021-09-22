const moment = require('moment-timezone');

const serverStatus = [{serverId:1, lastMessage: null, online: false}, {serverId:2, lastMessage: null, online: false}];
const AVATAR_BASE_PATH = 'https://cdn.discordapp.com/avatars/';
const ENABLE_DISCORD_EVENTS = true;

const getToDay = () => {
    return moment.tz('America/Argentina/Buenos_Aires');
}

const createEmptyUser = (user) => {
    return {
        id: user.id,
        avatar: user.avatar,
        username: user.username.toLowerCase(),
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

const exportsOptions = {
    format: "A4", orientation: "portrait", border: "10mm",
    header: { height: "10mm", contents: '<div style="font-size:small; text-align: right;">Los Magios</div>' },
    footer: { height: "10mm", contents: { default: '<div style="text-align: right;color: #444;">{{page}}</span>/<span>{{pages}}</div>' } }
};

const sessions = [];

exports.createEmptyUser = createEmptyUser;
exports.getToDay = getToDay;
exports.serverStatus = serverStatus;
exports.exportsOptions = exportsOptions;
exports.AVATAR_BASE_PATH = AVATAR_BASE_PATH;
exports.ENABLE_DISCORD_EVENTS = ENABLE_DISCORD_EVENTS;