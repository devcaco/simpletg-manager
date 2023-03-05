const express = require('express');
const router = express.Router();

// ℹ️ Handles password encryption
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');

const { getUserLocale } = require('get-user-locale');
const geoip = require('geoip-lite');

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// Require the User model in order to interact with the database
const Entity = require('../models/Entity.model');
const User = require('../models/User.model');
const UserSession = require('../models/UserSession.model');

const isLoggedOut = require('../middleware/isLoggedOut');

router.get('/login/:method?', isLoggedOut, checkLogOff, (req, res, next) => {
  if (req.params.method === 'signup')
    res.render('auth/login', { signup: true });
  else {
    res.render('auth/login', {
      login: true,
      loginFlash: req.flash('loginFlash'),
    });
  }
});

router.post('/login', isLoggedOut, async (req, res, next) => {
  const errorMsg = [];
  const { emailLogin: email, pwdLogin: password, rememberMe } = req.body;

  try {
    if (!email) errorMsg.push('Validation Error: E-Mail cannot be empty!');
    if (!password) errorMsg.push('Validation Error: Password cannot be empty!');

    if (errorMsg.length) throw new Error(errorMsg);

    const userData = await User.findOne({ email })
      .populate('entity')
      .populate({
        path: 'sessions',
        options: {
          sort: { date_login: 'desc' },
          limit: 5,
        },
      });

    if (!userData) throw new Error('User not found');

    const user = userData._doc;
    const pwdOk = await bcryptjs.compare(password, user.password);

    if (!pwdOk) throw new Error('Password is invalid');

    const superAdminData = await User.findOne({
      entity: user.entity,
      role: 'Super Admin',
    }).populate({
      path: 'sessions',
      options: {
        sort: { date_login: 'desc' },
        limit: 5,
      },
    });

    if (!superAdminData) throw new Error('No SuperAdmin found for the Entity');
    const superAdmin = superAdminData._doc;

    if (superAdmin.sessions.length)
      superAdmin.last_login =
        superAdmin.sessions[0].date_login.toLocaleDateString();
    else superAdmin.last_login = 'None';

    req.session.currentUser = user;
    req.session.role = {
      superAdmin: user.role === 'Super Admin',
      admin: user.role === 'Admin',
      user: user.role === 'User',
    };
    req.session.entity = user.entity;
    req.session.superAdmin = superAdmin;

    let userIP = req.headers['x-forwarded-for'] || req.ip;
    userIP = userIP.split(',');
    const geo = geoip.lookup(userIP[0]);

    const saveNewSession = await UserSession.create({
      user: user._id,
      date_login: new Date(),
      system_info: req.headers['user-agent'],
      user_locale: getUserLocale(),
      ip_address: req.headers['x-forwarded-for'] || req.ip,
      geo_info: geo,
    });

    req.flash('messages', {
      type: 'success',
      message: 'Login successful - Welcome',
    });

    res.redirect(req.session._bounceTo || '/dashboard');
  } catch (err) {
    console.log({ Error: err });

    if (err.message === 'User not found') errorMsg.push('User not found');
    if (err.message === 'Password is invalid')
      errorMsg.push('Password is invalid');

    if (!errorMsg.length) {
      errorMsg.push(err.message);
    }

    let flashMsg = [{ type: 'error', message: errorMsg }];

    res.status(500).render('auth/login', {
      login: true,
      flashMsg,
      form: { emailLogin: email },
    });
  }
});

router.post('/login/signup', isLoggedOut, async (req, res, next) => {
  const errorMsg = [];
  const {
    'signup-entity': entity,
    'signup-fname': fname,
    'signup-lname': lname,
    'signup-email': email,
    'signup-password': password,
  } = req.body;

  let newEntity = '';
  let newSuperAdmin = '';

  try {
    console.log('SIGNING UP NEW ENTITY');

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

    newEntity = await Entity.create({ name: entity });

    newUser = await User.create({
      entity: newEntity,
      fname,
      lname,
      email,
      role: 'Super Admin',
      password: hashedPassword,
    });

    req.flash('loginFlash', 'Signup Successful, you can now login');
    res.redirect('/auth/login');
  } catch (err) {
    console.log({ Error: JSON.stringify(err) });

    if (newEntity) await Entity.findByIdAndDelete(newEntity);

    if (err instanceof mongoose.Error.ValidationError) {
      errorMsg.push(err.message);
    }
    if (err.code === 11000) {
      errorMsg.push(
        'E-Mail Address and Company Name must be unique. Either the Company or E-Mail is in use'
      );
    }
    if (!errorMsg.length) {
      errorMsg.push(err.message);
    }

    let flashMsg = [{ type: 'error', message: errorMsg }];

    res.status(500).render('auth/login', {
      signup: true,
      flashMsg,
      form: { entity, fname, lname, emailSignup: email },
    });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect('/auth/login?Off=true');
  });
});

function checkLogOff(req, res, next) {
  if (req.query.Off) {
    req.flash('messages', {
      type: 'success',
      message: 'Sign-Off successful - Good bye!',
    });
    res.redirect('/auth/login');
  }
  next();
}

module.exports = router;
