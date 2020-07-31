const { MongoClient } = require('mongodb');
const BaseDriver = require('@cubejs-backend/query-orchestrator/driver/BaseDriver');
const { parseSqlQuery } = require('../parser/parseSqlQuery');

class MongodbDriver extends BaseDriver {
  constructor(config) {
    super();
    const { pool, ...restConfig } = config || {};
    this.config = {
      host: process.env.CUBEJS_DB_HOST,
      database: process.env.CUBEJS_DB_NAME,
      port: process.env.CUBEJS_DB_PORT,
      user: process.env.CUBEJS_DB_USER,
      password: process.env.CUBEJS_DB_PASS,
      ...restConfig
    };
    this.client = null;
    this.connection = null;
    this.getConnection();
  }

  async getConnection() {
    if (this.client && this.connection) {
      return this.connection;
    }

    const connectionString = `mongodb://${this.config.host}:${this.config.port}/${this.config.database}?authSource=admin`;

    await new Promise((resolve, reject) => {
      MongoClient.connect(connectionString, (err, client) => {
        if (err) {
          reject(err);
        }
        console.log('Connected successfully to server');
        this.connection = client.db(this.config.database);
        this.client = client;
        resolve();
      });
    });

    return this.connection;
  }

  async closeConnection() {
    this.client.close();
    this.client = null;
    this.connection = null;
  }

  async testConnection() {
    const conn = await this.getConnection();
    const isConnected = conn && conn.topology && conn.topology.isConnected();

    return isConnected;
  }

  async query(query, values) {
    const conn = await this.getConnection();
    const parsedQuery = parseSqlQuery(query, values);

    return conn.collection(parsedQuery.source).aggregate(parsedQuery.aggregate, { allowDiskUse: true }).toArray();
  }

  async release() {
    await this.closeConnection();
  }
}

module.exports = MongodbDriver;
