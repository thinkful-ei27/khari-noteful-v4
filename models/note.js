'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  title: { type: String, index: true },
  content: { type: String, index: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true }
});

schema.set('timestamps', true);

schema.set('toJSon',{
  vituals: true,
  transform: function(doc, result){
    delete result._id;
    delete result._v;
  }
});

module.exports = mongoose.model('Note', schema);
