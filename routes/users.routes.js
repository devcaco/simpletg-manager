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

const navmenu = require('../utils/navigation');

const rolesOptions = [
  { title: 'Admin', selected: false },
  { title: 'User', selected: false },
];

router.get('/', isLoggedIn, async (req, res, next) => {
  navmenu.forEach((elem) => (elem.active = elem.title === 'Users'));

  const users = await User.find({
    entity: req.session.entity._id,
    role: { $ne: 'Super Admin' },
  });

  console.log({ users });
  res.render('users', {
    superAdmin: req.session.superAdmin,
    users,
    rolesOptions,
  });
});

router.get('/:id', isLoggedIn, async (req, res, next) => {
  const users = await User.find({
    entity: req.session.entity._id,
    role: { $ne: 'Super Admin' },
  });

  try {
    let user = '';
    if (req.params.id) user = await User.findById(req.params.id);

    if (!user) throw new Error('User Not Found');

    const form = { ...user };
    rolesOptions.forEach(
      (elRole) => (elRole.selected = form._doc.role === elRole.title)
    );

    res.render('users', {
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

router.post('/delete', isLoggedIn, async (req, res, next) => {
  const userId = req.body.userId;
  const errorMsg = [];

  try {
    console.log('Deleting User');
    console.log({ userId });
    if (!userId) errorMsg.push('User Not Found');

    const delUser = await User.findByIdAndDelete(userId);

    if (errorMsg.length) throw new Error(errorMsg);
    res.redirect('../../users');
  } catch (err) {
    console.log({ error: err });
    if (!errorMsg.length) errorMsg.push(err.message);

    res.status(500).render('users', { error: true, errorMsg });
  }
});

router.post('/pwd', isLoggedIn, async (req, res, next) => {
  const { userId, password, password2 } = req.body;
  const errorMsg = [];

  try {
    console.log('Resetting Pwd');
    console.log({ userId });

    if (!password || !password2) errorMsg.push('Required Fields are empty');
    if (password !== password2) errorMsg.push('Passwords do not match');

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

    res.redirect('../../users');
  } catch (err) {
    console.log({ error: err });
    if (!errorMsg.length) errorMsg.push(err.message);

    res.status(500).render('users', { error: true, errorMsg });
  }
});

router.post('/:id', isLoggedIn, async (req, res, next) => {
  const { userId, fname, lname, email, role } = req.body;
  const errorMsg = [];
  const users = await User.find({
    entity: req.session.entity._id,
    role: { $ne: 'Super Admin' },
  });

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

    res.status(500).render('users', {
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
  const users = await User.find({
    entity: req.session.entity._id,
    role: { $ne: 'Super Admin' },
  });
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
    req.flash('userSaved', 'User was successfully created');
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
    res.status(500).render('users', {
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

module.exports = router;
