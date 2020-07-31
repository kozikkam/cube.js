#!/usr/bin/env node
const CubejsServer = require('../');

process.env.CUBEJS_API_SECRET = 'sdddg';

process.env.CUBEJS_DB_HOST = 'localhost';
process.env.CUBEJS_DB_NAME = 'test';
process.env.CUBEJS_DB_PORT = '27017';

const server = new CubejsServer({
  dbType: 'mongodb',
});

server.listen().then(({ version, port }) => {
  console.log(`🚀 Cube.js server (${version}) is listening on ${port}`);
}).catch(e => {
  console.error('Fatal error during server start: ');
  console.error(e.stack || e);
});
