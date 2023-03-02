const express = require('express');
const router = express.Router();
const navmenu = require('../utils/navigation');
// const WorkSheet = require('../models/WorkSheet.model');

const isLoggedOut = require('../middleware/isLoggedOut');
const isLoggedIn = require('../middleware/isLoggedIn');

router.get('/', isLoggedIn, async (req, res, next) => {
  navmenu.forEach((elem) => (elem.active = elem.title === 'Devices'));
  try {
    res.render('devices/devices', {});
  } catch (err) {
    console.log({ Error: err });
    next(err);
  }
});

module.exports = router;
