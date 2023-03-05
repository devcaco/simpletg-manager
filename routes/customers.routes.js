const express = require('express');
const router = express.Router();
const navmenu = require('../utils/navigation');

const isLoggedIn = require('../middleware/isLoggedIn');

const Entity = require('../models/Entity.model');
const User = require('../models/User.model');
const UserSession = require('../models/UserSession.model');
const Customer = require('../models/Customer.model');
const CustomerNotes = require('../models/CustomerNotes.model');

router.use('/*', (req, res, next) => {
  res.locals.view = 'customers/customers';
  next();
});

/* GET home page */
router.get('/', isLoggedIn, async (req, res, next) => {
  navmenu.forEach((elem) => (elem.active = elem.title === 'Customers'));
  try {
    const customers = await getCustomers();

    res.render('customers/customers', { customers });
  } catch (err) {
    console.log({ error: err });

    res.locals.errorMsg = err;
    next('customers/customers');
  }
});

router.get('/edit/:id', isLoggedIn, async (req, res, next) => {
  const errorMsg = [];
  const customerId = req.params.id;
  const customers = await getCustomers();

  try {
    console.log('GETTING CUSTOMER INFOOOO');
    if (!customerId) errorMsg.push('No customer provided');

    const theCustomer = await Customer.findById(customerId);

    if (!theCustomer) errorMsg.push('No Customer Found');

    res.render('customers/customers', {
      edit: true,
      customers,
      form: theCustomer,
    });
  } catch (err) {
    console.log({ error: err });
    next('customers/customers');
  }
});

router.get('/details/:id/:section?', isLoggedIn, async (req, res, next) => {
  navmenu.forEach((elem) => (elem.active = elem.title === 'Customers'));
  const customerId = req.params.id;
  const errorMsg = [];
  const section = req.params.section || 'details';

  try {
    console.log('GETTING CUSTOMER DETAILS');

    if (!customerId) errorMsg.push('No customerId provided');

    const data = await Customer.findById(customerId).populate({
      path: 'notes',
      populate: {
        path: 'user',
      },
    });

    if (!data) errorMsg.push('Customer not found!');
    if (errorMsg.length) throw new Error(errorMsg);

    const customer = {
      ...data._doc,
      type: data.isBusiness ? 'Business' : 'Individual',
      createdAt: data.createdAt.toLocaleString(),
      updatedAt: data.updatedAt.toLocaleString(),
    };
    console.log({ customer });
    console.log({ CustomerNotes: customer.notes });

    res.render('customers/customerDetails', { customer, section });
  } catch (err) {
    console.log({ Error: err });
    // res.locals.errorMsg = err
    // res.locals.errorMsg = err.message;
    console.log({ ELERRORRRRR: res.locals.errorMsg });
    next('customers/customers');
  }
});

router.get('/favorite/:id/:fav', isLoggedIn, async (req, res, next) => {
  const customerId = req.params.id;
  const customerFav = req.params.fav;
  const errorMsg = [];
  try {
    console.log('SETTING CUSTOMER AS FAVORITE');

    if (!customerId) errorMsg.push('No customerId provided');
    if (!customerFav) errorMsg.push('No Favorite Specified');

    const data = await Customer.findByIdAndUpdate(
      customerId,
      { isFavorite: customerFav },
      { new: true }
    );
    if (!data) errorMsg.push('Error setting customer as favorite');
    if (errorMsg.length) throw new Error(errorMsg);

    res.redirect('/customers');
  } catch (err) {
    console.log({ Error: err });

    res.locals.errorMsg = err;
    next('customers/customers');
  }
});

router.post('/', isLoggedIn, async (req, res, next) => {
  const errorMsg = [];
  const { isBusiness, custName, dba, email, website, phoneNumber } = req.body;
  const address = {
    address1: req.body.address1,
    city: req.body.city,
    state: req.body.state,
    zipCode: req.body.zipCode,
  };

  try {
    console.log('ADDING NEW CUSTOMER');

    if (!custName || !email)
      errorMsg.push('Please fill out all required fields');

    const newCustomer = await Customer.create({
      entity: req.session.superAdmin._id,
      isBusiness,
      custName,
      dba,
      email,
      website,
      phoneNumber: [{ type: 'main', number: phoneNumber }],
      address,
    });
    if (errorMsg.length) throw new Error(errorMsg);

    res.redirect('/customers');
  } catch (err) {
    console.log({ error: err });

    res.locals.errorMsg = err;
    next('customers/customers');
  }
});

router.post('/edit/:id', isLoggedIn, async (req, res, next) => {
  const errorMsg = [];
  const { customerId, isBusiness, custName, dba, email, website, phoneNumber } =
    req.body;
  const address = {
    address1: req.body.address1,
    city: req.body.city,
    state: req.body.state,
    zipCode: req.body.zipCode,
  };

  try {
    console.log('EDITING NEW CUSTOMER');

    if (!custName || !email)
      errorMsg.push('Please fill out all required fields');

    const savedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      {
        isBusiness,
        custName,
        dba,
        email,
        website,
        phoneNumber: [{ type: 'main', number: phoneNumber }],
        address,
      },
      { new: true }
    );
    if (errorMsg.length) throw new Error(errorMsg);

    res.redirect('/customers');
  } catch (err) {
    console.log({ error: err });

    res.locals.errorMsg = err;
    next('customers/customers');
  }
});

router.post('/details/:id/notes', isLoggedIn, async (req, res, next) => {
  console.log('ADDING NEW CUSTOMER NOTE');
  const customerId = req.params.id;
  const userId = req.session.currentUser._id;
  const { note } = req.body;

  const errorMsg = [];

  try {
    if (!note || !customerId || !userId)
      errorMsg.push('Required Field missing.');

    const newNote = await CustomerNotes.create({
      customer: customerId,
      user: userId,
      note,
    });

    req.flash('customer', 'Note added successfully');
    res.redirect('/customers/details/' + customerId + '/notes');
    if (errorMsg.length) throw new Error(errorMsg);
  } catch (err) {
    console.log({ Error: err });
    res.render('customers/customerDetails', {
      error: true,
      errorMsg,
      section: 'notes',
    });
  }
});

router.post('/delete', isLoggedIn, async (req, res, next) => {
  const errorMsg = [];
  const customerId = req.body.customerId;
  console.log({ customerID: req.body.customerId });
  try {
    console.log('DELETING CUSTOMER');
    if (!customerId) errorMsg.push('No userId provided');

    if (errorMsg.length) throw new Error(errorMsg);

    const delCustomer = await Customer.findByIdAndDelete(customerId);

    res.redirect('/customers');
  } catch (err) {
    console.log({ Error: err });

    res.locals.errorMsg = err;
    next('customers/customers');
  }
});

const getCustomers = async () => {
  const customers = await Customer.find();

  customers.forEach(
    (el) => (el.type = el.isBusiness ? 'Business' : 'Individual')
  );
  return customers;
};
module.exports = router;
