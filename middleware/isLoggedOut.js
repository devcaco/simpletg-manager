module.exports = (req, res, next) => {
  if (req.session.currentUser) {
    req.flash('messages', {
      type: 'error',
      message: 'Already loggedIn',
    });
    return res.redirect(req.session.bounceTo || '/dashboard');
  }
  next();
};
