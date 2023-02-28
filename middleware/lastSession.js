const lastSession = (req, res, next) => {
  if (req.session.superAdmin && req.session.superAdmin.sessions.length) {
    const sessions = new Date(req.session.superAdmin.sessions[0].date_login);
    req.session.superAdmin.last_session = sessions.toLocaleString();
  } else if (req.session.superAdmin) {
    req.session.superAdmin.last_session = 'None';
  }
  next();
};

module.exports = { lastSession };
