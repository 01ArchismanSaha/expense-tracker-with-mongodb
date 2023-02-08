const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//id, name , password, phone number, role

const forgotPasswordSchema = new Schema({
    active: {
        type: Boolean,
        required: true
    },
    expiresby: {
        type: Date
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
})

module.exports = mongoose.model('ForgotPassword', forgotPasswordSchema);