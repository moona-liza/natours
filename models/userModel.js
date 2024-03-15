const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!'],
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: {type:String,default:'default.jpg'},
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'Password are not the same!',
        },
    },
    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

userSchema.pre('save', async function (next) {
    // Only run this function if password actually Modified
    if (!this.isModified('password')) return next();

    // Hash  the password the cost 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete ComfirmPassword field
    this.passwordConfirm = undefined;
    next();
});

// run reset password is Modified
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangeAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword,
) {
    return await bcrypt.compare(candidatePassword.toString(), userPassword);
};

userSchema.methods.changePasswordAfter = async function (JWTTimestamp) {
    if (this.passwordChangeAt) {
        const changeTimestamp = parseInt(
            this.passwordChangeAt.getTime() / 1000,
            10,
        );
        // console.log(changeTimestamp, JWTTimestamp);
        // console.log(JWTTimestamp < changeTimestamp);
        return JWTTimestamp < changeTimestamp; // 100<300 = true => change ,
    }

    //500<300 = false =>mean not change
    return false;
};

//import top --> const crypto = require('crypto')

userSchema.methods.changePasswordResetToken = async function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
