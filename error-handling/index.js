module.exports = (app) => {
  app.use((req, res, next) => {
    // this middleware runs whenever requested page is not available
    req.session.invalidUrl = true;
    let goTo = req.session.bounceTo ? req.session.bounceTo : '/auth/login';
    if (goTo == req.originalUrl) goTo = '/dashboard';

    req.flash('messages', {
      type: 'error',
      message: 'Invalid Application Route. Please use the correct path',
    });

    res.redirect(goTo);
  });

  app.use((err, req, res, next) => {
    // whenever you call next(err), this middleware will handle the error
    // always logs the error

    // only render if the error ocurred before sending the response
    const errorMsg = [];
    if (!res.headersSent) {
      console.log({ completeError: err });
      errorMsg.push(err.message);
      errorMsg.forEach((error) => {
        req.flash('messages', {
          type: 'error',
          message: 'Application Error - ' + error,
        });
      });
      const bounceTo =
        req.session.bounceTo == req.originalUrl
          ? '/dashboard'
          : req.session.bounceTo;

      // req.session.errorCount++;
      
      
        res.redirect(bounceTo || '/dashboard');
    }
  });
};
