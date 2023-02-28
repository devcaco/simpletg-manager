const { Schema, model } = require('mongoose');
const User = require('../models/User.model');

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const userSessionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date_login: {
      type: Date,
      required: true,
    },
    date_logout: Date,
    system_info: String,
    ip_address: String,
    geo_info: Object,
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

userSessionSchema.pre('save', async function (next) {
  const session = this;
  if (this.isNew) {
    await User.findByIdAndUpdate(
      session.user,
      { $push: { sessions: session._id } },
      { new: true }
    );
  }
});
const UserSession = model('UserSession', userSessionSchema);

module.exports = UserSession;
