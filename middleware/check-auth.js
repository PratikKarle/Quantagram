const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

module.exports = (req,res,next) => {
    if(req.method === 'OPTIONS')
    {        
        return next();
    }
    try{
        const token = req.headers.authorization.split(' ')[1]; // Bearer Token
        if(!token)
            {
                throw new Error('Authentication Failed');
            }
        const decodedToken = jwt.verify(token,process.env.JWT_KEY);
        req.userData = {userId: decodedToken.userId};
        next();
    }
    catch(err)
    {
        return next(new HttpError('Authentication Failed',401));
    }
    
};