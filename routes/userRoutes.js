const express = require('express');

const userController = require('./../controllers/userController');

const authController = require('./../controllers/authController');


const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// protect all route after this middelware
router.use(authController.protect);

//current password update
router.patch('/updateMyPassword', authController.updatePassword);
// get current user
router.get('/me', userController.getMe, userController.getUser);
//current user data update   

router.patch('/updateMe',userController.uploadUserPhoto,userController.resizeUserPhoto, userController.updateMe);

//current user Deleted
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));
router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updataUser)
    .delete(userController.deleteUser);

module.exports = router;
