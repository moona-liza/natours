const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD,
);

mongoose
    // .connect(process.env.DATABASE_LOCAL, {
    .connect(DB, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('DB Connections successful!'));

// console.log(process.env.NODE_ENV);

const port = process.env.PORT||5000;
const server = app.listen(port, () => {
    console.log(`App runing on port ${port} ...`);
});
  
process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION! 💥 shutting down...');
    server.close(() => {
        process.exit(1);
    });
});

process.on('uncaughtException', (err) => {
    console.log(err.name, err.message);
    console.log('UNHANDLED EXCEPTION! 💥 shutting down...');
    server.close(() => {
        process.exit(1);
    });
});

// console.log(x);
