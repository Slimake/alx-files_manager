import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost'; // Host
    const port = process.env.DB_PORT || 27017; // Port
    const dbName = process.env.DB_DATABASE || 'files_manager'; // Database
    const url = `mongodb://${host}:${port}`; // Connection URL
    this.connect = false;
    this.db = null;

    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect((err) => {
      if (!err) {
        this.db = this.client.db(dbName);
        this.connect = true;
      }
    });
  }

  isAlive() {
    return this.connect;
  }

  async nbUsers() {
    const count = this.db.collection('users').countDocuments();
    return Promise.resolve(count);
  }

  async nbFiles() {
    const count = this.db.collection('files').countDocuments();
    return Promise.resolve(count);
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
