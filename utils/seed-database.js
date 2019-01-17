'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');
const User = require('../models/user');

const { folders, notes, tags, users } = require('../db/data');

console.log(`Connecting to mongodb at ${MONGODB_URI}`);
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useCreateIndex : true })
  .then(() => {
    console.info('Deleting Data...');
    return Promise.all([
      Note.deleteMany(),
      Folder.deleteMany(),
      Tag.deleteMany(),
    ]);
  })
  .then(() => {
    console.info('Seeding Database...');
    return Promise.all([
      Note.insertMany(notes),
      Note.createIndexes(),
      Folder.insertMany(folders),
      Tag.insertMany(tags),
      User.insertMany(users)
    ]);
  })
  .then(results => {
    console.log('Inserted', results);
    console.info('Disconnecting...');
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    return mongoose.disconnect();
  });

Note.on('index', ()=>{
  console.info('notes index is done building');
});

Folder.on('index', ()=>{
  console.info('folder index is done building');
});

Tag.on('index',()=>{
  console.info('tag index is done building');
});