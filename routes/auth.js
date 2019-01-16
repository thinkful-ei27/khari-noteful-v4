'use strict';

const express = require('express');
const router = express.Router();

const passport = require('passport');
const {JWT_SECRET, JWT_EXPIRY} = require('config');

const options = {session: false, failWithError: true};
const localAuth = passport.authenticate('local', options);

const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true});
router.post('/refresh', jwtAuth, (req, res) =>{
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

function createAuthToken (user){
  return JWT_EXPIRY.sign({ user }, JWT_SECRET,{
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}


router.post('/login', localAuth, function(req, res){
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = router;