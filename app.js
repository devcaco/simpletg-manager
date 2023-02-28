// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require('dotenv').config();
const path = require('path');
// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require('express');
// Handles the handlebars
// https://www.npmjs.com/package/hbs
const hbs = require('hbs');

hbs.registerHelper('math', function (lvalue, operator, rvalue, options) {
  lvalue = parseFloat(lvalue);
  rvalue = parseFloat(rvalue);

  return {
    '+': lvalue + rvalue,
  }[operator];
});

hbs.registerPartials(path.join(__dirname, 'views/partials'));

const app = express();

// ℹ️ Connects to the database
app.MONGO_URI = require('./db').MONGO_URI;

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require('./config')(app);

const capitalize = require('./utils/capitalize');
const projectName = 'simpletg-manager';

const navmenu = require('./utils/navigation');

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

app.locals.appTitle = `SIMPLETG MANAGER`;

// 👇 Start handling routes here
const indexRoutes = require('./routes/index.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const customerRoutes = require('./routes/customers.routes');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/customers', customerRoutes);

app.locals.navmenu = navmenu;
// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require('./error-handling')(app);

console.log({ MONGO_URI: process.env.MONGODB_URI });
module.exports = app;
