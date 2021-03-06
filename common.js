const moment = require('moment-timezone');

const AVATAR_BASE_PATH = 'https://cdn.discordapp.com/avatars/';
const ENABLE_DISCORD_EVENTS = false;

const getToDay = () => {
    return moment.tz('America/Argentina/Buenos_Aires');
}

const createEmptyUser = (user) => {
    return {
        id: user.id,
        avatar: user.avatar,
        username: user.username.toLowerCase(),
        joinDate: getToDay().format('DD/MM/YYYY HH:mm:ss'),
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

const terrains = ["Persian Gulf", "Syria", "Channel", "Normandy 1944", "Nevada"];
const jets = ["A-10C", "A-10CII", "F/A-18C", "F-16C", "F-5E", "F-86F", "F-15C", "MIG-29", "SU-33", "SU-27", "SU-25", "A-10A", "L-39", "MIG-15bis", "C-101", "JF-17", "M-2000C",	"F-14", "AJS37", "MB-339", "AV-8B", "MIG-21bis", "MIG-19"];
const warbirds = ["BF-109K", "FW-190A", "FW-190D", "P-47", "Spitfire MKIX", "P-51", "Mosquito", "I-16"];
const helis = ["AH-64D", "MI-24P", "Ka-50", "Mi-8MTV2",	"UH-1H", "SA-342"];
const others = ["CA", "Supercarrier", "NS-430", "Christen Eagle II", "YAK-52", "WWII Asset Pack"];

exports.createEmptyUser = createEmptyUser;
exports.getToDay = getToDay;

exports.AVATAR_BASE_PATH = AVATAR_BASE_PATH;
exports.ENABLE_DISCORD_EVENTS = ENABLE_DISCORD_EVENTS;

exports.exportsOptions = exportsOptions;
exports.terrains = terrains;
exports.jets = jets;
exports.warbirds = warbirds;
exports.helis = helis;
exports.others = others;