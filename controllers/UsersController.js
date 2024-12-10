import SHA1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static postNew(req, res) {
    const { email, password } = req.body;
    const { db } = dbClient;

    if (email === undefined) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (password === undefined) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

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
}

module.exports = UsersController;
