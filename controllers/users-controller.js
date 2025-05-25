const HttpError = require('../models/http-error');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const user = require('../models/user');
  
const getUsers = async (req,res,next)=>{

    let users;
    try{    
        users = await user.find({},'-password');
    }
    catch(err)
    {
        return next(new HttpError('Something went wrong! Try again',500));
    }

    res.json({users:users.map((u)=>u.toObject({getters:true}))});
};

const signUpUser = async (req,res,next)=>{

    if(!validationResult(req).isEmpty())
    {
        return next(new HttpError('Entered user details are wrong, please check input!'));
    }

    const {name,email,password} = req.body;
    let hasUser;
    
        try{    
            hasUser = await user.findOne({email:email});
        }
        catch(err)
        {
            return next(new HttpError('Something went wrong! Try again',500));
        }

    if(hasUser)
    {
        return next(new HttpError('Could not create user, already exists. Please login!',422));
    }


    let hashedPassword;
    try{
        hashedPassword = await bcrypt.hash(password,16);
    }catch(err)
    {
        return next(new HttpError('Could not create user. Something went wrong!',500));
    }

    let newUser = new user({
        name,
        email,
        password: hashedPassword,
        places:[],
        image: req.file.path
    });
    

    try{
        await newUser.save();
    }catch(err)
    {
        return next(new HttpError('Could not create user. Something went wrong!',500));
    }

    let token;
    try{
        token = jwt.sign({
            userId: newUser.id, email: newUser.email},
            process.env.JWT_KEY,
            {expiresIn:'1h'}
        );
    }catch(err)
    {
        return next(new HttpError('Could not create user. Something went wrong!',500));
    }

    res.status(201).json({userId:newUser.id, email: newUser.email, token:token});
};

const loginUser = async (req,res,next)=>{
    const {email,password} = req.body;
    
    let existingUser;
    
    try{    
        existingUser = await user.findOne({email:email});
    }
    catch(err)
    {
        return next(new HttpError('Something went wrong! Try again',500));
    }

    if(!existingUser)
    {
        return(new HttpError('Invalid Credentials!',401));
    }
    

    let isValidPassword = false;
    try{
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    }catch(err)
    {
        return next(new HttpError('Could not login for requested user, Something went wrong!',500));
    }

    if(!isValidPassword)
    {
        return(new HttpError('Invalid Credentials!',401));
    }

    let token;
    try{
        token = jwt.sign({
            userId: existingUser.id, email: existingUser.email},
            process.env.JWT_KEY,
            {expiresIn:'1h'}
        );
    }catch(err)
    {
        return next(new HttpError('Could not Login. Something went wrong!',500));
    }

    res.json({    
        userId: existingUser.id,
        email: existingUser.email, 
        token:token
    }); 

};

exports.getUsers = getUsers;
exports.signUpUser = signUpUser;
exports.loginUser = loginUser;