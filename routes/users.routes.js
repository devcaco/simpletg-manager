const express = require('express');
const router = express.Router();
const fileUploader = require('../config/cloudinary.config');

// ℹ️ Handles password encryption
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');

// How many rounds should bcrypt run the salt (default - 10 rounds)
const saltRounds = 10;

// Require the User model in order to interact with the database
const User = require('../models/User.model');

const isLoggedIn = require('../middleware/isLoggedIn');

const navmenu = require('../utils/navigation');

const rolesOptions = [
  { title: 'Admin', selected: false },
  { title: 'User', selected: false },
];

router.get('/', isLoggedIn, getUsers, async (req, res, next) => {
  navmenu.forEach((elem) => (elem.active = elem.title === 'Users'));

  const users = req.users;

  try {
    res.render('users/users', {
      superAdmin: req.session.superAdmin,
      users,
      rolesOptions,
    });
  } catch (err) {
    err.errorIn = 'User ---> User GET Route';
    next(err);
  }
});

router.get('/edit/:id', isLoggedIn, getUsers, async (req, res, next) => {
  const users = req.users;
  let userId = req.params.id;
  let errorMsg = [];
  try {
    if (!userId) throw new Error('No userId Provided');
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const form = { ...user._doc };
    rolesOptions.forEach(
      (elRole) => (elRole.selected = form.role === elRole.title)
    );

    res.render('users/users', {
      edit: true,
      form,
      rolesOptions,
      users,
      superAdmin: req.session.superAdmin,
    });
  } catch (err) {
    err.errorIn = 'Users ---> Edit GET Route';
    next(err);
  }
});

router.get('/details/:id', isLoggedIn, getUsers, async (req, res, next) => {
  const users = req.users;
  const userId = req.params.id;
  const errorMsg = [];
  try {
    if (!userId) errorMsg.push('No userId provided');

    const user = await User.findById(userId);
    if (!user) errorMsg.push('User not found');

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
    err.errorIn = 'User ---> Details GET route';
    next(err);
  }
});

router.post('/delete', isLoggedIn, async (req, res, next) => {
  const userId = req.body.userId;
  const errorMsg = [];

  try {
    if (!userId) errorMsg.push('No userId provided');

    const delUser = await User.findByIdAndDelete(userId);

    if (errorMsg.length) throw new Error(errorMsg);
    req.flash('messages', {
      type: 'success',
      title: 'User Deleted',
      message: 'User successfully deleted',
    });
    res.redirect('/users');
  } catch (err) {
    err.errorIn = 'USER ---> User delete POST route';
    next(err);
  }
});

router.post('/pwd', isLoggedIn, getUsers, async (req, res, next) => {
  const { userId, password, password2, username } = req.body;
  const errorMsg = [];
  const users = req.users;

  try {
    if (!password || !password2)
      errorMsg.push('Required fields are empty, please provide all fields');
    if (password !== password2) errorMsg.push('Passwords do not match');

    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(password)) {
      errorMsg.push(
        'Password must be at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.'
      );
    }

    if (!userId) errorMsg.push('No UserID Provided');

    const user = await User.findById(userId);

    if (!user) errorMsg.push('User Not Found');

    if (errorMsg.length) throw new Error(errorMsg);

    const salt = await bcryptjs.genSalt(saltRounds);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { runValidators: true, new: true, context: 'query', unique: true }
    );

    req.flash('messages', {
      type: 'success',
      title: 'User Updated',
      message: `User's password successfully updated`,
    });
    res.redirect('/users');
  } catch (err) {
    err.errorIn = 'User ----> pwd POST route';
    console.log('ERROR IN USER -> ', err);
    if (!errorMsg.length) errorMsg.push(err.message);

    res.status(500).render('users/users', {
      error: true,
      pwd: true,
      errorMsg,
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

router.post('/edit/:id', isLoggedIn, getUsers, async (req, res, next) => {
  const { userId, fname, lname, email, role } = req.body;
  const users = req.users;
  const errorMsg = [];

  try {
    if (!userId || !fname || !lname || !email || !role) {
      errorMsg.push(
        'Validation Error: Required fields empty. Please provide all required fields.'
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

    req.flash('messages', {
      type: 'success',
      title: 'User Updated',
      message: `User successfully updated`,
    });
    res.redirect('/users');
  } catch (err) {
    err.errorIn = 'User ----> edit POST route';
    console.log('ERROR IN USER -> ', err);
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
      superAdmin: req.session.superAdmin,
      rolesOptions,
    });
  }
});

router.post('/', isLoggedIn, getUsers, async (req, res, next) => {
  const { fname, lname, email, password, password2, role } = req.body;
  const users = req.users;
  const errorMsg = [];

  try {
    if (!fname || !lname || !email || !password || !password2 || !role) {
      errorMsg.push(
        'Validation Error: Required fields empty. Please provide all required fields.'
      );
    }

    if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(password)) {
      errorMsg.push(
        'Password must be at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.'
      );
    }

    if (password !== password2) {
      errorMsg.push(
        'Password fields do not match. Please make sure to re-type the correct password'
      );
    }

    if (errorMsg.length) throw new Error(errorMsg);

    const salt = await bcryptjs.genSalt(saltRounds);
    const hashedPassword = await bcryptjs.hash(password, salt);

    let newUser = await User.create({
      entity: req.session.entity._id,
      fname,
      lname,
      email,
      password: hashedPassword,
      role,
    });

    req.flash('messages', {
      type: 'success',
      title: 'User Created',
      message: `User successfully created`,
    });
    res.redirect('/users');
  } catch (err) {
    err.errorIn = 'User ----> Creating new user POST route';
    console.log('ERROR IN USER -> ', err);

    if (err instanceof mongoose.Error.ValidationError) {
      errorMsg.push(err.message);
    }

    if (err.code === 11000) {
      errorMsg.push('E-Mail address is already registered.');
    }

    rolesOptions.forEach((elRole) => (elRole.selected = role === elRole.title));

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

async function getUsers(req, res, next) {
  try {
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
    req.users = users;
    next();
  } catch (err) {
    err.errorIn = 'Users --> getUsers() middleware';
    next(err);
  }
}

module.exports = router;
