const express = require('express');
const router = express.Router();

// ℹ️ Handles password encryption
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// Require the User model in order to interact with the database
const Entity = require('../models/Entity.model');
const User = require('../models/User.model');

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require('../middleware/isLoggedOut');
const isLoggedIn = require('../middleware/isLoggedIn');

// POST /auth/signup
router.post('/login/:method?', isLoggedOut, async (req, res, next) => {
  if (req.body.method === 'signup') {
    console.log('REGISTERING NEW ENTITY');
    let errorMsg = [];
    const {
      'signup-entity': entity,
      'signup-fname': fname,
      'signup-lname': lname,
      'signup-email': email,
      'signup-password': password,
    } = req.body;
    try {
      // Check required fields are provided
      if (
        entity === '' ||
        email === '' ||
        fname === '' ||
        lname === '' ||
        password === ''
      ) {
        errorMsg.push(
          'All fields are mandatory. Please fill out all the fields.'
        );
      }

      if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(password)) {
        errorMsg.push(
          'Password must be at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.'
        );
      }

      if (errorMsg.length) throw new Error(errorMsg);

      const salt = await bcryptjs.genSalt(saltRounds);
      const hashedPassword = await bcryptjs.hash(password, salt);

      console.log({ salt, hashedPassword });

      let newEntity = await Entity.create({ name: entity });
      let newUser = await User.create({
        entity: newEntity._id,
        fname,
        lname,
        email,
        role: 'Super Admin',
        password: hashedPassword,
      });

      console.log({ newUser });
      req.flash('registered', 'Signup Successful, you can now login');
      res.redirect('/auth/login');
    } catch (err) {
      if (err instanceof mongoose.Error.ValidationError) {
        errorMsg.push(err.message);
      }
      if (err.code === 11000) {
        errorMsg.push(
          'E-Mail Address and Company Name must be unique. Either the Company or E-Mail is in use'
        );
      }
      if (!errorMsg.length) {
        errorMsg.push('Unknown Error');
      }
      console.log({ error: errorMsg });
      res.status(500).render('auth/login', {
        signup: true,
        error: true,
        errorMsg,
        form: { entity, fname, lname, email },
      });
    }
  } else {
    //LOGIN POST
    console.log('LOGGING IN');
    let errorMsg = [];
    const { email, password, rememberMe } = req.body;
    try {
      if (!email) errorMsg.push('Validation Error: E-Mail cannot be empty!');
      if (!password)
        errorMsg.push('Validation Error: Password cannot be empty!');

      if (errorMsg.length) throw new Error(errorMsg);

      const user = await User.findOne({ email }).populate('entity');

      console.log({ user });

      if (!user) throw new Error('User not found');

      const pwdOk = await bcryptjs.compare(password, user.password);

      if (!pwdOk) throw new Error('Password is invalid');

      req.session.currentUser = user;
      req.session.roles = {
        superAdmin: user.role === 'Super Admin',
        Admin: user.role === 'Admin',
        User: user.role === 'User',
      };
      req.session.entity = user.entity;
      req.session.superAdmin = await User.findOne({
        entity: user.entity,
        role: 'Super Admin',
      });

      res.redirect('/dashboard');
    } catch (err) {
      console.log({ error: err });
      if (err.message === 'User not found') errorMsg.push('User not found');
      if (err.message === 'Password is invalid')
        errorMsg.push('Password is invalid');
      if (!errorMsg.length) {
        errorMsg.push('Unknown Error');
      }
      res.status(500).render('auth/login', {
        login: true,
        error: true,
        errorMsg,
        form: { email },
      });
    }
  }
});

// GET /auth/login
router.get('/login/:method?', isLoggedOut, (req, res) => {
  if (req.params.method === 'signup')
    res.render('auth/login', { signup: true });
  else {
    res.render('auth/login', {
      login: true,
      registered: req.flash('registered'),
    });
  }
});

// GET /auth/logout
router.post('/logout', isLoggedIn, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).render('auth/logout', { errorMessage: err.message });
      return;
    }

    res.redirect('/auth/login');
  });
});

module.exports = router;
