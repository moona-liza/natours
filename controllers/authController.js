const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = (user, stausCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() +
                process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
        ),
        // secure: true,
        httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);
    // Remove the password from output
    user.password = undefined;

    res.status(stausCode).json({
        status: 'success',
        token,
        // header:"Content-Type: application/json",
        data: {
            user,
        },
    });
};

// exports.signup = catchAsync(async (req, res, next) => {
//     const newUser = await User.create({
//         name: req.body.name,
//         email: req.body.email,
//         role: req.body.role,
//         password: req.body.password,
//         passwordConfirm: req.body.passwordConfirm,
//         passwordChangeAt: req.body.passwordChangeAt,
//     });
//     createSendToken(newUser, 201, res);
// });

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);

    const url =`${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser , url).sendWelcome();

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    // 1.) Check if email and Password exsit
    if (!email || !password) {
        return next(new AppError('please provide email and password', 400));
    }
    // 2.) Check if User exsits &&  Password Correct
    const user = await User.findOne({ email }).select('+password');
    // const correct = await user.correctPassword(password, user.password)

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    // 3.) Check everything is OK send token to client
    createSendToken(user, 200, res);
});

// LOGOUT
exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    })
        .status(200)
        .json({ status: 'success' });
    // res.clearCookie('jwt').json({
    //     status: 'success',
    //     message: 'Logged out',
    // });
};

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check of it's there
    const testToken = req.headers.authorization;
    let token;
    if (testToken && testToken.startsWith('Bearer')) {
        token = testToken.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    // console.log(token);

    if (!token) {
        return next(
            new AppError(
                'Your are not logged in! Please login to get access.',
                401,
            ),
        );
    }

    // 2) Varification Token
    // --->improt module top that file -> const { promisify } = require('util');
    // console.log(token);
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // console.log(decoded);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                'The user belonging to this token does no longer exist.',
                401,
            ),
        );
    }
    // 4) Check if user change password after the token was issues
    if (await currentUser.changePasswordAfter(decoded.iat)) {
        // console.log(decoded.iat);
        return next(
            new AppError(
                'User recently change password! please login again.',
                401,
            ),
        );
    }
    //  GRANT ACCESS TO PROTECT ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;

    next();
});

// Only for Randerd pages, No error
exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // 1) verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET,
            );
            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }
            // 3) Check if user change password after the token was issues
            if (await currentUser.changePasswordAfter(decoded.iat)) {
                return next();
            }
            //  THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']. role='user'
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You do not have permission to perform this action',
                    403,
                ),
            );
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) get user based on POSTED email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        next(new AppError('There is no user with email address.', 404));
    }

    // 2) genreat the random reset token
    const resetToken = await user.changePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) send it user's email




     try {
        const resetURL = `${req.protocol}://${req.get(
            'host',
        )}/api/v1/users/resetPassword/${resetToken}`;

        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email', 
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            'There was an error sending the email. Try again later!',
            500,
        );
    }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) get user based on the Token. 👉👉👉 improt top ->👍const crypto = require('crypto');
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    // 2) get user based on the Token
    if (!user) {
        return next(new AppError('Token is invalid or has expired!', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changePasswordaAt property for the user

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if Posted current password is correct
    if (
        !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
        return next(new AppError('Your current password is wrong!', 401));
    }

    // 3) If so , update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4) Log user in JWT
    createSendToken(user, 200, res);

    // return next(new AppError('errmsg',400))
});
