const { Schema, model } = require('mongoose');

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const userSchema = new Schema(
  {
    entity: {
      type: Schema.Types.ObjectId,
      ref: 'Entity',
      required: true,
    },
    fname: {
      type: String,
      required: [true, 'First name is required'],
      unique: false,
      trim: true,
    },
    lname: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      required: [true, 'Please select a Role'],
      enum: ['Super Admin', 'Admin', 'User'],
      default: 'User',
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: Object,
      required: false,
    },
    sessions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'UserSession',
      },
    ],
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
    autoIndex: true,
  }
);

userSchema.virtual('fullName').get(function () {
  return this.fname + ' ' + this.lname;
});

const User = model('User', userSchema);

module.exports = User;
