'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  title: { type: String, index: true },
  content: { type: String, index: true },
  created: { type: Date, default: Date.now },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: false }
});

schema.index({name:1, userId: 1}, {unique: true});

schema.set('toObject',{
  transform: function(doc, ret){
    ret.id = ret._id;
    delete ret._id;
    delete ret._v;
  }
});



/*
// Add `createdAt` and `updatedAt` fields
schema.set('timestamps', true);

// Transform output during `res.json(data)`, `console.log(data)` etc.
schema.set('toJSON', {
  virtuals: true,
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
  }
});
*/

module.exports = mongoose.model('Note', schema);
