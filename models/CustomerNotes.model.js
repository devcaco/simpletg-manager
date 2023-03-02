const { Schema, model } = require('mongoose');
const Customer = require('../models/Customer.model');

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const customerNotesSchema = new Schema(
  {
    note: {
      type: String,
      required: [true, 'A Note is required'],
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
    autoIndex: true,
  }
);

customerNotesSchema.pre('save', async function (next) {
  const note = this;
  if (this.isNew) {
    await Customer.findByIdAndUpdate(
      note.customer,
      { $push: { notes: note._id } },
      { new: true }
    );
  }
});

const CustomerNotes = model('CustomerNotes', customerNotesSchema);

module.exports = CustomerNotes;
