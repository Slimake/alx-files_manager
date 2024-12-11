import SHA1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  // sign-in the user by generating a new authentication token
  static getConnect(req, res) {
    // Get the base64 encoded string
    const base64encoded = req.get('Authorization');

    if (base64encoded && base64encoded.startsWith('Basic ')) {
      // Remove the 'Basic ' prefix
      const encodedData = base64encoded.slice(6);

      // decode the encodedData
      const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
      const colonIndex = decodedData.indexOf(':');
      const email = decodedData.slice(0, colonIndex);
      const password = decodedData.slice(colonIndex + 1);
      const encodedPass = SHA1(password);
      const { db } = dbClient;

      // query users collection for email passed
      db.collection('users').find({ email }).toArray((err, docs) => {
        if (err) throw err;

        if (docs.length === 0 || docs[0].password !== encodedPass) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        const token = uuidv4();
        const key = `auth_${token}`;
        const value = docs[0]._id.toString();
        redisClient.set(key, value, 86400);
        res.status(200).json({ token });
      });
    }
  }

  // sign-out the user based on the token
  static getDisconnect(req, res) {
    const token = req.get('X-Token');
    const key = `auth_${token}`;
    const { db } = dbClient;

    redisClient.get(key)
      .then((id) => {
        // query users collection for userId passed
        const userId = new ObjectId(id);
        db.collection('users').find({ _id: userId }).toArray((err, docs) => {
          if (err) throw err;
          if (docs.length === 0) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
          }

          redisClient.client.del(key, (err) => {
            if (err) throw err;
            res.status(204).json();
          });
        });
      })
      .catch((err) => {
        throw err;
      });
  }
}

module.exports = AuthController;
