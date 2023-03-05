const express = require('express');
const router = express.Router();
const navmenu = require('../utils/navigation');
const Customer = require('../models/Customer.model');

const isLoggedIn = require('../middleware/isLoggedIn');

/* GET home page */
router.get('/', isLoggedIn, (req, res, next) => {
  console.log('REDIRECTING FROM ROOT');
  res.redirect('/dashboard');
});

router.get('/dashboard', isLoggedIn, async (req, res, next) => {
  navmenu.forEach((elem) => (elem.active = elem.title === 'Dashboard'));
  try {
    const lastSessions = req.session.currentUser.sessions;

    const customers = await Customer.find({ isFavorite: true }).limit(5);

    lastSessions.forEach(
      (el) => (el.date_login = new Date(el.date_login).toLocaleString())
    );

    res.render('dashboard', { lastSessions, customers });
  } catch (err) {
    console.log({ Error: err });
    next(err);
  }
});

module.exports = router;
