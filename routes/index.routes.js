const express = require('express');
const router = express.Router();
const navmenu = require('../utils/navigation');

const isLoggedOut = require('../middleware/isLoggedOut');
const isLoggedIn = require('../middleware/isLoggedIn');

/* GET home page */
router.get('/', isLoggedIn, (req, res, next) => {
  res.render('index');
});

router.get('/dashboard', isLoggedIn, (req, res, next) => {
  navmenu.forEach((elem) => (elem.active = elem.title === 'Dashboard'));
  console.log({ navmenu });
  res.render('dashboard');
});

module.exports = router;
