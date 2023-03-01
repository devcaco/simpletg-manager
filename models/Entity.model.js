const { Schema, model } = require('mongoose');

// TODO: Please make sure you edit the User model to whatever makes sense in this case
const entitySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Entity name is required'],
      unique: true,
      trim: true,
    },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
    autoIndex: true,
  }
);

const Entity = model('Entity', entitySchema);

module.exports = Entity;
