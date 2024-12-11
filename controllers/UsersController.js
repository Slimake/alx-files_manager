import SHA1 from 'sha1';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class UsersController {
  static postNew(req, res) {
    const { email, password } = req.body;
    const { db } = dbClient;

    // if email was not passed in the request body return a 400 status code
    if (email === undefined) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    // if password was not passed in the request body return a 400 status code
    if (password === undefined) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    // Use the SHA algorithm to encode the password
    const encodedPass = SHA1(password);

    // Check if email already exists in DB
    const query = { email };
    db.collection('users').countDocuments(query, (err, count) => {
      if (err) {
        console.log(err.message);
      }

      // if email exists, respond with 400 status code
      if (count > 0) {
        res.status(400).json({ error: 'Already exist' });
      } else {
        // insert email and encodedPass into the database
        db.collection('users')
          .insertOne({ email, password: encodedPass }, (err, result) => {
            if (err) {
              console.log(err.message);
            } else {
              res.status(201).json({ id: result.insertedId, email });
            }
          });
      }
    });
  }

  static getMe(req, res) {
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

          res.json({ id: docs[0]._id, email: docs[0].email });
        });
      })
      .catch((err) => {
        throw err;
      });
  }
}

module.exports = UsersController;
