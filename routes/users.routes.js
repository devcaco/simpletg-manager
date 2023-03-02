const express = require('express');
const router = express.Router();
const fileUploader = require('../config/cloudinary.config');

// ℹ️ Handles password encryption
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// Require the User model in order to interact with the database
const Entity = require('../models/Entity.model');
const User = require('../models/User.model');
const Session = require('../models/UserSession.model');

// Require necessary (isLoggedOut and isLiggedIn) middleware in order to control access to specific routes
const isLoggedOut = require('../middleware/isLoggedOut');
const isLoggedIn = require('../middleware/isLoggedIn');

const navmenu = require('../utils/navigation');

const rolesOptions = [
  { title: 'Admin', selected: false },
  { title: 'User', selected: false },
];

router.get('/', isLoggedIn, async (req, res, next) => {
  navmenu.forEach((elem) => (elem.active = elem.title === 'Users'));

  const users = await getUsers(req);

  res.render('users/users', {
    superAdmin: req.session.superAdmin,
    users,
    rolesOptions,
    flashMessages: req.flash('userFlash'),
  });
});

router.get('/edit/:id', isLoggedIn, async (req, res, next) => {
  const users = await getUsers(req);

  try {
    let user = '';
    if (req.params.id) user = await User.findById(req.params.id);

    if (!user) throw new Error('User Not Found');

    const form = { ...user };
    rolesOptions.forEach(
      (elRole) => (elRole.selected = form._doc.role === elRole.title)
    );

    res.render('users/users', {
      edit: true,
      form: form._doc,
      rolesOptions,
      users,
      superAdmin: req.session.superAdmin,
    });
  } catch (err) {
    console.log({ error: err });
  }
});

router.get('/details/:id', isLoggedIn, async (req, res, next) => {
  const users = await getUsers(req);
  const errorMsg = [];
  const userId = req.params.id;
  try {
    console.log('GETTING USERS DETAILS');
    if (!userId) errorMsg.push('No user ID provided');
    const user = await User.findById(userId);
    if (!user) errorMsg.push('No user found with that ID');

    if (errorMsg.length) throw new Error(errorMsg);

    res.render('users/users', {
      details: true,
      user: {
        _id: user._id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt.toLocaleString(),
        createdAt: user.createdAt.toLocaleString(),
      },
      users,
      superAdmin: req.session.superAdmin,
    });
  } catch (err) {
    console.log({ error: err });

    next(err);
  }
});

router.post('/delete', isLoggedIn, async (req, res, next) => {
  const userId = req.body.userId;
  const errorMsg = [];
  const users = await getUsers(req);

  try {
    console.log('Deleting User');
    console.log({ userId });
    if (!userId) errorMsg.push('User Not Found');

    const delUser = await User.findByIdAndDelete(userId);

    if (errorMsg.length) throw new Error(errorMsg);
    req.flash('userFlash', 'The user was successfully deleted');
    res.redirect('/users');
  } catch (err) {
    console.log({ error: err });
    if (!errorMsg.length) errorMsg.push(err.message);

    res.status(500).render('users/users', { error: true, errorMsg });
  }
});

router.post('/pwd', isLoggedIn, async (req, res, next) => {
  const { userId, password, password2, username } = req.body;
  const errorMsg = [];
  const users = await getUsers(req);

  try {
    console.log('Resetting Pwd');
    console.log({ userId });

    if (!password || !password2) errorMsg.push('Required Fields are empty');
    if (password !== password2) errorMsg.push('Passwords do not match');

    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(password)) {
      errorMsg.push(
        'Password must be at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.'
      );
    }

    const user = await User.findById(userId);

    if (!user || !userId) errorMsg.push('User Not Found');

    if (errorMsg.length) throw new Error(errorMsg);

    const salt = await bcryptjs.genSalt(saltRounds);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const data = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { runValidators: true, new: true, context: 'query', unique: true }
    );
    req.flash('userFlash', `The user's password was successfully updated`);
    res.redirect('/users');
  } catch (err) {
    console.log({ error: err });
    if (!errorMsg.length) errorMsg.push(err.message);

    res.status(500).render('users/users', {
      error: true,
      errorMsg,
      pwd: true,
      users,
      superAdmin: req.session.superAdmin,
      form: { userId, username },
    });
  }
});

router.post(
  '/edit/profile',
  isLoggedIn,
  fileUploader.single('profilePicture'),
  async (req, res, next) => {
    const { userId, fname, lname, email } = req.body;
    const profilePicture = (req.file ? req.file.path : '') || '';
    const errorMsg = [];

    try {
      if (!fname || !lname || !email)
        errorMsg.push('Required fields are missing, please provide all fields');

      const savedUser = await User.findByIdAndUpdate(
        userId,
        { fname, lname, email, profilePicture },
        { new: true }
      ).populate({
        path: 'sessions',
        options: {
          sort: { date_login: 'desc' },
          limit: 5,
        },
      });

      req.session.currentUser = savedUser;

      console.log({ savedSessionUser: req.session.currentUser });

      if (errorMsg.length) throw new Error(errorMsg);

      res.send('User profile Saved');
    } catch (err) {
      console.log({ ERROR: err });

      res.status(500).end;
    }
  }
);

router.post('/edit/:id', isLoggedIn, async (req, res, next) => {
  const { userId, fname, lname, email, role } = req.body;
  const errorMsg = [];
  const users = await getUsers(req);

  try {
    console.log('Updating User Information');
    if (!userId || !fname || !lname || !email || !role) {
      errorMsg.push(
        'Validation Error: There are required fields empty. Please fill all required fields.'
      );
    }
    if (errorMsg.length) throw new Error(errorMsg);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fname,
        lname,
        email,
        role,
      },
      {
        runValidators: true,
        new: true,
        context: 'query',
        unique: true,
      }
    );

    req.flash('userFlash', `The user was successfully updated`);
    res.redirect('/users');
  } catch (err) {
    console.log({ error: err });

    if (err instanceof mongoose.Error.ValidationError) {
      errorMsg.push(err.message);
    }

    if (err.code === 11000) {
      errorMsg.push('E-Mail address is already registered.');
    }

    rolesOptions.forEach((elRole) => (elRole.selected = role === elRole.title));

    res.status(500).render('users/users', {
      edit: true,
      error: true,
      errorMsg,
      form: {
        _id: userId,
        fname,
        lname,
        email,
        role,
      },
      users,
      entityUser: req.session.entityUser,
      rolesOptions,
    });
  }
});

router.post('/', isLoggedIn, async (req, res, next) => {
  const { fname, lname, email, password, password2, role } = req.body;
  const errorMsg = [];
  const users = await getUsers(req);
  try {
    console.log('Adding new User');
    console.log({ body: req.body });
    if (!fname || !lname || !email || !password || !password2 || !role) {
      errorMsg.push(
        'Validation Error: There are required fields empty. Please fill all required fields.'
      );
    }

    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(password)) {
      errorMsg.push(
        'Password must be at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.'
      );
    }

    if (password !== password2) {
      errorMsg.push(
        'Password fields do not match. Please make sure to confirm the correct password'
      );
    }

    if (errorMsg.length) throw new Error(errorMsg);

    const salt = await bcryptjs.genSalt(saltRounds);
    const hashedPassword = await bcryptjs.hash(password, salt);

    console.log({ salt, hashedPassword });

    let data = await User.create({
      entity: req.session.entity._id,
      fname,
      lname,
      email,
      password: hashedPassword,
      role,
    });

    console.log({ data });
    req.flash('userFlash', `The user was successfully created`);
    res.redirect('./users');
  } catch (err) {
    console.log({ error: err });

    if (err instanceof mongoose.Error.ValidationError) {
      errorMsg.push(err.message);
    }

    if (err.code === 11000) {
      errorMsg.push('E-Mail address is already registered.');
    }

    rolesOptions.forEach((elRole) => (elRole.selected = role === elRole.title));
    console.log({ role, rolesOptions });
    res.status(500).render('users/users', {
      error: true,
      errorMsg,
      form: {
        fname,
        lname,
        email,
        role,
      },
      users,
      superAdmin: req.session.superAdmin,
      rolesOptions,
    });
  }
});

const getUsers = async (req) => {
  const users = await User.find({
    entity: req.session.entity._id,
    role: { $ne: 'Super Admin' },
  }).populate({
    path: 'sessions',
    options: {
      sort: { date_login: 'desc' },
      limit: 5,
    },
  });

  users.forEach((user) => {
    if (user.sessions.length)
      user.last_session = user.sessions[0].date_login.toLocaleString();
    else user.last_session = 'None';
  });

  return users;
};

module.exports = router;
