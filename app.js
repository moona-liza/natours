const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors =  require('cors')


const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const viewRouter = require('./routes/viewRoutes');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const path = require('path');

// Start Express App

const app = express();

app.use(cors());

// view engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1).GLOBLE MIDDALWARE
// FOR CSP HEADERS
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline'");
    next();
});
// Serving Static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP header
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('dev'));
}

// Limit request same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'To many requests from this IP, Please try again in an hour!',
});
app.use('/api', limiter);
//Preventing Parameter Pollution
app.use(
    hpp({
        whitelist: [
            'duration',
            'maxGroupSize',
            'ratingsAverage',
            'ratingsQuantity',
            'price',
            'difficulty',
        ],
    }),
);

// Body parser reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data Sanitization against onSQL query injection
app.use(mongoSanitize());
// Data Sanitization against XSS
app.use(xss());

// Test Middelware
app.use((req, res, next) => {
    req.RequestTime = new Date().toDateString();
    // console.log(req.cookies);
    next();
});

// 3).ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

app.all('*', (req, res, next) => {
    // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    // err.status = 'fail';
    // err.statusCode = 404

    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
// 4).SERVER LISTENING
module.exports = app;
