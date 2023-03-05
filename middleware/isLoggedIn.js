module.exports = (req, res, next) => {
  // checks if the user is logged in when trying to access a specific page

  //if(req.flash('error')) { console.log('hello')}

  if (!req.session.currentUser) {
    req.flash('messages', {
      type: 'error',
      message: 'Protected page - please login first',
    });
    req.session._bounceTo = req.originalUrl;
    return res.redirect('/auth/login');
  }

  // req.flash('error', ...res.locals.errorMsg);

  next();
};
