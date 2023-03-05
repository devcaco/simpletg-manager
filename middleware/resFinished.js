module.exports = (req, res, next) => {
  res.on('finish', () => {
    if (!req.session) return;
    req.session.errorCount = 0;
    req.session.redirects = 0;

    delete req.session.invalidUrl;
    delete res.locals.flashMsg;

    if (req.method == 'GET') req.session.bounceTo = req.originalUrl;

    req.session.save((err) => {
      if (err) throw err;
    });
  });

  next();
};
