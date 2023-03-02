module.exports = (req, res, next) => {
  // console.log({ FlashError1: req.flash('error') });
  // if an already logged in user tries to access the login page it
  // redirects the user to the home page
  if (req.session.currentUser) {
    return res.redirect('/');
  }
  next();
};
