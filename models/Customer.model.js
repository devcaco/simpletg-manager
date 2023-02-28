const { Schema, model } = require('mongoose');

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const customerSchema = new Schema(
  {
    entity: {
      type: Schema.Types.ObjectId,
      ref: 'Entity',
      required: true,
    },
    custName: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
      unique: true,
    },
    dba: {
      type: String,
      trim: true,
    },
    isBusiness: {
      type: Boolean,
      default: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
    },
    address: Object,
    website: String,
    phoneNumber: [],
    personnel: [],
    devices: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Device',
      },
    ],
    notes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Note',
      },
    ],
    workorders: [
      {
        type: Schema.Types.ObjectId,
        ref: 'WorkOrder',
      },
    ],
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
    autoIndex: true,
  }
);

const Customer = model('Customer', customerSchema);

module.exports = Customer;
