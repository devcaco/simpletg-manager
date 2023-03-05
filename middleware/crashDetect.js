module.exports = (req, res, next) => {
  if (!req.session.redirects) req.session.redirects = 0;
  req.session.redirects++;

  if (req.session.redirects >= 3) {
    res.send('APPLICATION CRASHED, PLEASE GO BACK TO MAIN PAGE');
  }

  next();
};
