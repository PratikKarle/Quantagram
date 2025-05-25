const { v4: uuid } = require('uuid');
const fs = require('fs');
const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const Place = require('../models/place');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');

//Get Place By Id Function
const getPlaceById = async (req,res,next) => {
    const placeId = req.params.pid; 
    let place;
    try{    
        place = await Place.findById(placeId);
    }
    catch(err)
    {
        return next(new HttpError('Something went wrong! Try again',500));
    }

    if(!place)
    {
        return next(new HttpError('Could not find a place for the requested Place ID',404));
    }
    res.json({place: place.toObject({getters:true})}); 
};

//Get Place by Creator User ID 

const getPlaceByUserId = async (req,res,next)=>{
    const userId = req.params.uid; 
    let userWithPlaces;

    try{
        userWithPlaces = await User.findById(userId).populate('places');
    }
    catch(err){
        return next(new HttpError('Something went wrong!'+err,500));
    }

    if(!userWithPlaces || userWithPlaces.places.length === 0)
    {
        return next(new HttpError('Could not find a places for the requested User ID',404));
    }

    res.json({places:userWithPlaces.places.map((p1)=>{return p1.toObject({getters:true})})}); 
};

const createPlace = async (req,res,next)=>{

    if(!validationResult(req).isEmpty())
    {
        throw new HttpError('Entered details are wrong, please check input!')
    }

    const {title,description,coordinates,address} = req.body;

    const createdPlace = new Place({
        title,
        description,
        address,
        location: coordinates,
        image: req.file.path,
        creator: req.userData.userId
    });

    let user;

    try{
        user = await User.findById(req.userData.userId);
    }
    catch(err)
    {
        const error = new HttpError('Something went wrong. Try again!',500);
        return next(error);
    }

    if(!user)
    {
        const error = new HttpError('User does not exist for provided ID of creator!',404);
        return next(error);    
    }

    try{

        const sesh = await mongoose.startSession();
        sesh.startTransaction();
        await createdPlace.save({session:sesh});
        user.places.push(createdPlace);
        await user.save({session: sesh});
        sesh.commitTransaction();
    }
    catch(err)
    {
        const error = new HttpError('Creating Place failed. Try again!',500);
        return next(error);
    }

    res.status(201).json({place:createdPlace});
};

const updatePlace = async (req,res,next)=>{

    if(!validationResult(req).isEmpty())
    {
        throw new HttpError('Entered details are wrong, please check input!')
    }

    const {title,description} = req.body;
    let place;

    const placeId = req.params.pid; 

    try{
        place = await Place.findById(placeId);
    }
    catch(err){
        return next(new HttpError('Could not find place!',404));
    }

    if (place.creator.toString() !== req.userData.userId)
    {
        return next(new HttpError('You are not allowed to edit this place!',401))
    }

    place.title = title;
    place.description = description;

    try{
        await place.save();
    }
    catch(err)
    {
        return next(new HttpError('Something went wrong!',500));
    }

    res.status(200).json({place:place.toObject({getters:true})});
};

const deletePlace = async (req,res,next)=>{
    const placeId = req.params.pid; 
    let place;
    try{    
        place = await Place.findById(placeId).populate('creator');
    }
    catch(err)
    {
        return next(new HttpError('Something went wrong! Try again',500));
    }

    if(!place)
    {
        return next(new HttpError('Could not find a place for the requested Place ID',404));
    }

    if (place.creator.id !== req.userData.userId)
    {
        return next(new HttpError('You are not allowed to delete this place!',401))
    }
    
    const imagePath = place.image;

    try{
        const sesh = await mongoose.startSession();
        sesh.startTransaction();
        await Place.findByIdAndDelete(placeId,{session:sesh});
        place.creator.places.pull(placeId);
        await place.creator.save({session:sesh});
        sesh.commitTransaction();
    }
    catch(err)
    {
        return next(new HttpError('Something Went Wrong!'+err,500));
    }

    fs.unlink(imagePath, err => {});
    res.status(200).json({message:'Data Deleted'});
};

exports.getPlaceById = getPlaceById;
exports.getPlaceByUserId = getPlaceByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;