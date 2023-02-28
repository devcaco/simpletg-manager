const express = require('express');
const router = express.Router();
const navmenu = require('../utils/navigation');

const isLoggedOut = require('../middleware/isLoggedOut');
const isLoggedIn = require('../middleware/isLoggedIn');

const Entity = require('../models/Entity.model');
const User = require('../models/User.model');
const UserSession = require('../models/UserSession.model');
const Customer = require('../models/Customer.model');

/* GET home page */
router.get('/', isLoggedIn, async (req, res, next) => {
  navmenu.forEach((elem) => (elem.active = elem.title === 'Customers'));
  try {
    const customers = await getCustomers();

    res.render('customers', { customers });
  } catch (err) {
    console.log({ error: err });

    res.end();
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

    res.render('customers', { edit: true, customers, form: theCustomer });
  } catch (err) {
    console.log({ error: err });
    next(err);
  }
});

router.get('/details/:id', isLoggedIn, async (req, res, next) => {
  navmenu.forEach((elem) => (elem.active = elem.title === 'Customers'));
  const customerId = req.params.id;
  const errorMsg = [];
  try {
    console.log('GETTING CUSTOMER DETAILS');

    if (!customerId) errorMsg.push('No customerId provided');

    const data = await Customer.findById(customerId);
    if (!data) errorMsg.push('Customer not found!');
    if (errorMsg.length) throw new Error(errorMsg);

    const customer = {
      ...data._doc,
      type: data.isBusiness ? 'Business' : 'Individual',
      createdAt: data.createdAt.toLocaleString(),
      updatedAt: data.updatedAt.toLocaleString(),
    };
    console.log({ customer });
    res.render('customerDetails', { customer });
  } catch (err) {
    console.log({ Error: err });

    next(err);
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

    res.redirect('../../../customers');
  } catch (err) {
    console.log({ Error: err });

    next(err);
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

    res.redirect('../../../customers');
  } catch (err) {
    console.log({ error: err });

    res.end();
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

    res.redirect('../../../customers');
  } catch (err) {
    console.log({ error: err });

    next(err);
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

    res.redirect('../../../customers');
  } catch (err) {
    console.log({ Error: err });

    next(err);
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
