'use strict';

const express = require('express');
const mongoose = require('mongoose');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');


const router = express.Router();

const  missingTitle  = (req, res, next) =>{
  const {title} = req.body;
  if(!title){
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  } else {
    next();
  }
};

const validateFolderId = (req, res, next) =>{
  const { folderId } = req.body;
  if (folderId && !mongoose.Types.ObjectId.isValid(folderId)){
    const err = new Error('The `folderId` is not valid');
    err.status = 400;
    return next(err);
  } else {
    next();
  }
};

const validateTagIds = (req, res, next) =>{
  const { tags } = req.body;
  if(tags){
    const badIds = tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));
    if(badIds.length){
      const err = new Error('The `tags` array contains an invalid `id`');
      err.status = 400;
      return next(err);
    } else {
      return next();
    }
  } else {
    next();
  }
};

const validateFolderUserId = (req, res, next) =>{
  const { folderId } = req.body;
  const userId = req.user.id;

  if(folderId){
    Folder.findById(folderId)
      .then(folder =>{
        if(!folder || !folder.userId.equals(userId)){
          const err = new Error('The `folderId` is not valid');
          err.status = 400;
          return next(err);
        } else{
          return next();
        }
      })
      .catch(err => next(err));
  } else{
    return next();
  }
};

const validateTagsUserIds = (req, res, next) =>{
  const { tags } = req.body;
  const userId = req.user.id;

  if(tags){
    Promise.all(tags.map(tagId => Tag.findById(tagId)))
      .then(tags => {
        const badIds = tags.filter(tag => !tag.userId.equals(userId));
        if(badIds.length){
          const err = new Error('The `tags` array contains an invalid ID');
          err.status = 400;
          return next(err);
        } else{
          return next();
        }
      });
  }else{
    next();
  }
};

const validationSuite = [missingTitle, validateFolderId, validateTagIds, validateFolderUserId, validateTagsUserIds];

/* ========== GET/READ ALL ITEMS ========== */
router.get('/', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  console.log(req.user);
  const userId = req.user.id;

  let filter = { userId };

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.$or = [{ 'title': re }, { 'content': re }];
  }

  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }

  Note.find(filter)
    .populate('tags')
    .sort({ updatedAt: 'desc' })
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOne({ _id: id, userId })
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', missingTitle, validateFolderId, validateTagIds, validateFolderUserId, validateTagsUserIds, (req, res, next) => {
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;

  const newNote = { title, content, folderId, tags, userId };
  if (newNote.folderId === '') {
    delete newNote.folderId;
  }

  Note.create(newNote)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', validationSuite, (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const toUpdate = { userId };
  const updateableFields = ['title', 'content', 'folderId', 'tags'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.title === '') {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (toUpdate.tags) {
    const badIds = toUpdate.tags.filter((tag) => !mongoose.Types.ObjectId.isValid(tag));
    if (badIds.length) {
      const err = new Error('The `tags` array contains an invalid `id`');
      err.status = 400;
      return next(err);
    }
  }

  if (toUpdate.folderId === '') {
    delete toUpdate.folderId;
    toUpdate.$unset = {folderId : 1};
  }

  Note.findByIdAndUpdate(id, toUpdate, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id();

  /***** Never trust users - validate input *****/
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findByIdAndRemove(id)
    .then(() => {
      res.sendStatus(204);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
