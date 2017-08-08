const mongoose = require('ngpd-mos-common-be/mongoose');

const classificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      validate: {
        validator: val => val && val.length > 0,
        message: '{ VALUE } shouldn\'t be empty'
      },
      required: [true, 'Name is required']
    },
    shortName: {
      type: String,
      validate: {
        validator: val => val && val.length > 0,
        message: '{ VALUE } shouldn\'t be empty'
      },
      required: [true, 'Short name is required']
    },
    gradeSets: {
      type: [{
        effectiveDate: { type: String, required: true },
        primary: { type: Boolean, required: true },
        grades: {
          type: [{
            title: { type: String, required: true },
            min: { type: Number, required: true },
            max: { type: Number, required: true }
          }],
          required: true
        }
      }],
      required: true
    },
  },
  {
    collection: 'classifications',
  }
);

module.exports = mongoose.model('classifications', classificationSchema);
