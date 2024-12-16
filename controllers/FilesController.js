import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static postUpload(req, res) {
    const token = req.get('X-Token');
    const key = `auth_${token}`;
    const { db } = dbClient;

    redisClient.get(key)
      .then(async (id) => {
        // query users collection for userId passed
        const userId = new ObjectId(id);
        const docs = await db.collection('users').find({ _id: userId }).toArray();
        if (docs.length === 0) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        // get data from the client
        const { name, type, data } = req.body;
        const parentId = req.body.parentId || 0;
        const isPublic = req.body.isPublic || false;
        const typeList = ['file', 'image', 'folder'];

        if (!name) {
          res.status(400).json({ error: 'Missing name' });
          return;
        }
        if (!type || !typeList.includes(type)) {
          res.status(400).json({ error: 'Missing type' });
          return;
        }
        if (!data && type !== 'folder') {
          res.status(400).json({ error: 'Missing data' });
          return;
        }
        // Check if there's any collection in the database with the parentId
        if (parentId) {
          const docs = await dbClient.db
            .collection('files').find({ _id: ObjectId(parentId) }).toArray();
          if (docs.length === 0) {
            res.status(400).json({ error: 'Parent not found' });
            return;
          }
          if (docs && docs[0].type !== 'folder') {
            res.status(400).json({ error: 'Parent is not a folder' });
            return;
          }
        }
        if (type === 'folder') {
          /* if type is folder, add the new file document in the DB
          and return the new file with a status code 201 */
          dbClient.db
            .collection('files')
            .insertOne(
              {
                userId,
                name,
                type,
                isPublic,
                parentId,
              }, (err, result) => {
                if (err) throw err;
                if (result) {
                  res.status(201).json({
                    id: result.insertedId,
                    userId,
                    name,
                    type,
                    isPublic,
                    parentId,
                  });
                }
              },
            );
        } else {
          let folderPath = process.env.FOLDER_PATH;
          const filename = uuidv4();
          if (!folderPath) {
            folderPath = '/tmp/files_manager';
          }
          const localPath = `${folderPath}/${filename}`;

          const decodedData = Buffer.from(data, 'base64').toString('utf-8');
          fs.writeFileSync(localPath, decodedData);

          dbClient.db
            .collection('files')
            .insertOne(
              {
                userId,
                name,
                type,
                isPublic,
                parentId,
                localPath,
              }, (err, result) => {
                if (err) throw err;
                if (result) {
                  res.status(201).json({
                    id: result.insertedId,
                    userId,
                    name,
                    type,
                    isPublic,
                    parentId,
                  });
                }
              },
            );
        }
      })
      .catch((err) => {
        throw err;
      });
  }
}

module.exports = FilesController;
