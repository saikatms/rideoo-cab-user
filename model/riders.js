const mongoose = require('mongoose');
const moment = require('moment');

const riders = mongoose.Schema(
    {
        name: String,
        email: String,
        phone: {
            type: String,
            default: ''
        },
        gender: {
            type: String,
            enum : ['M','F'],
        },
        password: String,
        referalCode: String,
        profileImg: String,
        refreshToken: String,
        userType: {
            type: String,
            enum : ['N','F','G'], // N = Normal, F = Facebook, G = Google
            default: 'N'
        },
        status: {
            type: String,
            enum : ['Y','N','B'],
            default: 'Y'
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: { 
            type: Date,
            default: Date.now
        }
    },
    { versionKey: false }
);

// Virtual for date generation
riders.virtual('createdOn').get(function () {
    const generateTime = moment(this.createdAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});
riders.virtual('updatedOn').get(function () {
    const generateTime = moment(this.updatedAt).format( 'DD-MM-YYYY h:m:ss A');
    return generateTime;
});

module.exports = mongoose.model('rido_riders', riders);