require('dotenv').config();
const PostgresClient = require('pg').Client;
const common = require('./common');

const TAG = '[magios-datacollector-bot]';

const postgresClient = new PostgresClient({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
    ssl: true
});

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

postgresClient.connect().then(() => {
    console.log(TAG + ' - Database is connected.');
}).catch(err => {
    console.log(TAG + ' - Error connecting database.');
});

const removeUser = async (user) => {
    const query = { text: 'DELETE FROM magios2 WHERE id = $1', values: [user.id] };
    await postgresClient.query(query);
}

const updateUser = async (user) => {
    const query = { text: 'UPDATE magios2 SET username = $2, data = $3 WHERE id = $1', values: [user.id, user.username, JSON.stringify(user)] };
    await postgresClient.query(query);
}

const saveUser = async (user) => { 
    const query = { text: 'INSERT INTO magios2 (id, username, data) VALUES($1, $2, $3)', values: [user.id, user.username, JSON.stringify(user)] };
    await postgresClient.query(query);
 }

 const findUserByUsername = async (username) => {
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

 const getUser = async (userId) => { 
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

const getAllUsers = async () => {
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

const updateServerStatus = async (server) => {
    const query = { text: 'UPDATE server_status SET status = $2, updated = $3 WHERE id = $1', values: [server.id, server.status, server.updated ] };
    const res = await postgresClient.query(query);
}

const getServerStatus = async () => {
    try {
        const query =  { text: 'SELECT * FROM server_status ORDER BY id ASC' };
        const res = await postgresClient.query(query);
        return res.rows;
    } catch (err) {
        return [];
    }
}

const getServerStatusById = async (id) => {
    try {
        const query =  { text: 'SELECT * FROM server_status WHERE id = $1', values:[id]};
        const res = await postgresClient.query(query);
        if (res.rows.length > 0) {
            return res.rows[0];
        } else {
            return null
        }
    } catch (err) {
        return null;
    }
}

const createDataBase = async () => { 
    //await postgresClient.query('CREATE TABLE server_status (id TEXT, status boolean, updated TEXT)');
    //await postgresClient.query('CREATE TABLE magios2 (id TEXT, data TEXT)');
    
 //   let query = { text: 'INSERT INTO server_status (id, status, updated) VALUES($1, $2, $3)', values: ['1', false, common.getToDay().format('DD/MM/YYYY HH:mm:ss')] };
 //   await postgresClient.query(query);

 //   query = { text: 'INSERT INTO server_status (id, status, updated) VALUES($1, $2, $3)', values: ['2', false, common.getToDay().format('DD/MM/YYYY HH:mm:ss')] };
 //   await postgresClient.query(query);
}

exports.removeUser = removeUser;
exports.updateUser = updateUser;
exports.saveUser = saveUser;
exports.findUserByUsername = findUserByUsername;
exports.getUser = getUser;
exports.getAllUsers = getAllUsers;
exports.createDataBase = createDataBase;
exports.updateServerStatus = updateServerStatus;
exports.getServerStatus = getServerStatus;
exports.getServerStatusById = getServerStatusById;