const express = require('express');
const router = express.Router();

// ℹ️ Handles password encryption
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// Require the User model in order to interact with the database
const SuperUser = require('../models/SuperUser.model');

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require('../middleware/isLoggedOut');
const isLoggedIn = require('../middleware/isLoggedIn');

// POST /auth/signup
router.post('/login/:method?', isLoggedOut, async (req, res, next) => {
  if (req.body.method === 'signup') {
    console.log('REGISTERING NEW ENTITY');
    let errorMsg = [];
    try {
      const {
        'signup-company': company,
        'signup-fname': fname,
        'signup-lname': lname,
        'signup-email': email,
        'signup-password': password,
      } = req.body;

      // Check required fields are provided
      if (
        company === '' ||
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
          'Password most be at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.'
        );
      }

      if (errorMsg.length) throw new Error(errorMsg);

      const salt = await bcryptjs.genSalt(saltRounds);
      const hashedPassword = await bcryptjs.hash(password, salt);

      console.log({ salt, hashedPassword });

      let data = await SuperUser.create({
        company,
        fname,
        lname,
        email,
        password: hashedPassword,
      });

      console.log({ data });
      req.flash('registered', 'Signup Successful, you can now login');
      res.redirect('/auth/login');
    } catch (err) {
      const {
        'signup-company': company,
        'signup-fname': fname,
        'signup-lname': lname,
        'signup-email': email,
      } = req.body;
      // if (err instanceof mongoose.Error.ValidationError) {}
      if (err.code === 11000) {
        errorMsg.push(
          'E-Mail Address and Company Name must be unique. Either the Company or E-Mail is in use'
        );
      }
      console.log({ error: errorMsg });
      res.status(500).render('auth/login', {
        signup: true,
        error: true,
        errorMsg,
        form: { company, fname, lname, email },
      });
    }
  } else {
    //LOGIN POST
    console.log('LOGGING IN');
    let errorMsg = [];
    try {
      const { email, password, rememberMe } = req.body;

      if (!email) errorMsg.push('Validation Error: E-Mail  cannot be empty!');
      if (!password)
        errorMsg.push('Validation Error: Password cannot be empty!');

      if (errorMsg.length) throw new Error(errorMsg);

      const superUser = await SuperUser.findOne({ email });
      if (!superUser) throw new Error('User not found');

      console.log({ superUser });
      const pwdOk = await bcryptjs.compare(password, superUser.password);

      if (!pwdOk) throw new Error('Password is invalid');

      req.session.currentUser = superUser;
      res.redirect('/dashboard');
    } catch (err) {
      console.log({ error: err });
      if (err.message === 'User not found') errorMsg.push('User not found');
      if (err.message === 'Password is invalid') errorMsg.push('Password is invalid');
      res
        .status(500)
        .render('auth/login', { login: true, error: true, errorMsg });
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

// POST /auth/login
router.post('/login2', isLoggedOut, (req, res, next) => {
  const { username, email, password } = req.body;

  // Check that username, email, and password are provided
  if (username === '' || email === '' || password === '') {
    res.status(400).render('auth/login', {
      errorMessage:
        'All fields are mandatory. Please provide username, email and password.',
    });

    return;
  }

  // Here we use the same logic as above
  // - either length based parameters or we check the strength of a password
  if (password.length < 6) {
    return res.status(400).render('auth/login', {
      errorMessage: 'Your password needs to be at least 6 characters long.',
    });
  }

  // Search the database for a user with the email submitted in the form
  User.findOne({ email })
    .then((user) => {
      // If the user isn't found, send an error message that user provided wrong credentials
      if (!user) {
        res
          .status(400)
          .render('auth/login', { errorMessage: 'Wrong credentials.' });
        return;
      }

      // If user is found based on the username, check if the in putted password matches the one saved in the database
      bcrypt
        .compare(password, user.password)
        .then((isSamePassword) => {
          if (!isSamePassword) {
            res
              .status(400)
              .render('auth/login', { errorMessage: 'Wrong credentials.' });
            return;
          }

          // Add the user object to the session object
          req.session.currentUser = user.toObject();
          // Remove the password field
          delete req.session.currentUser.password;

          res.redirect('/');
        })
        .catch((err) => next(err)); // In this case, we send error handling to the error handling middleware.
    })
    .catch((err) => next(err));
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
