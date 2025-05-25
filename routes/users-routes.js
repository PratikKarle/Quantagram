const express = require('express');
const {check} = require('express-validator');

const userControllers = require('../controllers/users-controller');
const fileUpload =require('../middleware/file-upload');

const router = express.Router();

router.get('/',userControllers.getUsers);

router.post('/signup',
        fileUpload.single('image'),
        [check('name').not().isEmpty(),
        check('password').isLength({min: 5}),
        check('email').normalizeEmail().isEmail()]
        ,userControllers.signUpUser);

router.post('/login',userControllers.loginUser);

module.exports = router;