module.exports = (app) => {
  app.use((req, res, next) => {
    // this middleware runs whenever requested page is not available
    res.render('auth/login', {
      login: true,
      error: true,
      errorMsg: ['Route not found'],
    });
  });

  app.use((err, req, res, next) => {
    // whenever you call next(err), this middleware will handle the error
    // always logs the error

    // only render if the error ocurred before sending the response
    if (!res.headersSent) {
      console.log({ theEROOOOOOOOR: err });
      res.end
      // res.render(res.locals.view, { error: true, errorMsg: res.locals.errorMsg });
      // req.flash('error', 'unknown error, please check console.');
      // res.redirect('/');
      // res.status(500).render('public/error');
    }
  });
};
