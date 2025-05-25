const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error')
const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));
app.use(express.static(path.join('public')));

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers','Origin,X-Requested-With,Content,Content-Type,Accept,Authorization');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE');
    return next();
});

app.use('/api/places',placesRoutes);

app.use('/api/users',usersRoutes);

app.use((req,res,next) => {
    res.sendFile(path.resolve(__dirname,'public','index.html'));
});
// app.use((req,res,next)=>{
//     const error = new HttpError('Could not find this route', 404);
//     throw error;
// });

app.use((error,req,res,next)=>{
    if(req.file)
    {
        fs.unlink(req.file.path, err => {});
    }
    if(res.headerSent)
    {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || 'Unknown error occured on server'});
})

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mernstackcluster.l6modin.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=MERNStackCluster`)
.then(()=> {
    app.listen(5000);
})
.catch((err)=>{
    console.log(err)
});
