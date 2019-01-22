'use strict';

const express = require('express');

const User = require('../models/user');

const router = express.Router();


router.post('/', async (req,res,next) =>{
  const { fullname, username, password } =  req.body;

  /*****************Validation**********************/
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    const err = new Error(`Missing '${missingField}' in request body`);
    err.status = 422;
    return next(err);
  }

  const stringFields = ['username', 'password', 'fullname'];
  const nonStringFields = stringFields.find( 
    field => field in req.body && typeof req.body[field] !== 'string'
  );
  if (nonStringFields){
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringFields
    });
  }

  const trimmedFields = ['username', 'password'];
  trimmedFields.forEach(field=>{
    if(field !== field.trim()){
      const err = new Error(`${field} must not have whitepace at beginning or end`);
      err.status = 422;
    }
  });

  if(!username.length >= 1){
    const err = new Error('Username must be at least 1 character');
    err.status = 422;
  }

  if(!password.length >= 8 && password.length <= 72){
    const err = new Error('Password must be between 8 and 72 characters long');
    err.status = 422;
  }



  return User.hashPassword(password)
    .then(digest => {
      const newUser = {
        username,
        password: digest
      };
      if(fullname){ newUser.fullname = fullname.trim(); }
      return User.create(newUser);
    })
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The username already exists');
        err.status = 400;
      }
      next(err);
    });
});

module.exports = router;