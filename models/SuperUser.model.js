const { Schema, model } = require('mongoose');

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const superUserSchema = new Schema(
  {
    company: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fname: {
      type: String,
      required: true,
      unique: false,
      trim: true,
    },
    lname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const SuperUser = model('User', superUserSchema);

module.exports = SuperUser;
