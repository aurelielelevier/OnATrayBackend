var express = require('express');
var router = express.Router();
var uniqid = require('uniqid');
var uid2 = require("uid2");
var SHA256 = require("crypto-js/sha256");
var encBase64 = require("crypto-js/enc-base64");

var cloudinary = require('cloudinary').v2;
cloudinary.config({ 
  cloud_name: 'dpyqb49ha', 
  api_key: '513712396958631', 
  api_secret: 'VQta0R5Tlg-lEsbYWnLjh-AnN1I' 
});
const fs = require('fs');

var talentModel = require('../model/talents')
var restaurantModel = require ('../model/restaurants')

router.post('/sign_in', async function(req,res,next){
  // On cherche d'abord dans la base de données talents (logiquement leur nombre sera superieur)
  var talentToSearch = await talentModel.findOne({email : req.body.email})
  if(talentToSearch){
    var hash = SHA256(req.body.password + talentToSearch.salt).toString(encBase64)
    if (talentToSearch.password == hash){
      talentToSearch = await talentModel.findOne({email : req.body.email}).populate('wishlistTalent').populate('experience').populate('formation').exec()
      res.json({result:true, type:'talent', profil: talentToSearch})
    } else {
      res.json({result : 'Error'})
    }
  }
  // Sinon on cherche dans base de données restaurants
  else {
    var restauToSearch = await restaurantModel.findOne({email : req.body.email})
    if(restauToSearch){
      var hashh = SHA256(req.body.password + restauToSearch.salt).toString(encBase64)
      if (restauToSearch.password == hashh){
      restauToSearch = await restaurantModel.findOne({email : req.body.email}).populate('wishlistRestaurant').exec()
        res.json({result : true, type:'restaurant', profil: restauToSearch})
      }else{
        res.json({result : 'Error'})
      }
    }else{
      res.json({result : 'Error'})
    }
  }
  });

  router.post('/upload/:token', async function(req, res, next) {
    // upload de la photo de profil et enregistrement sur Cloudinary, copie du lien en BDD
    
    // si l'utilisateur fait partie des restaurants :
    if (await restaurantModel.findOne({token:req.params.token})){
      var uniqidPhoto = `/tmp/${uniqid()}${req.files.photo.name}`
      var resultCopy = await req.files.photo.mv(uniqidPhoto);
      var resultCloudinary = await cloudinary.uploader.upload(uniqidPhoto);
      await restaurantModel.updateOne({token:req.params.token}, {photo: resultCloudinary.url})
      var user = await restaurantModel.findOne({token:req.params.token}).populate('wishlistRestaurant').exec();;

    } else {
      // si l'utilisateur fait partie des talents :
      var uniqidPhoto = `/tmp/${uniqid()}${req.files.photo.name}`
      var resultCopy = await req.files.photo.mv(uniqidPhoto);
      var resultCloudinary = await cloudinary.uploader.upload(uniqidPhoto);
      var user = await talentModel.updateOne({token:req.params.token}, {avatar:resultCloudinary.url})
      var user = await talentModel.findOne({token:req.params.token}).populate('formation').populate('experience').populate('wishlistTalent').exec();
      }
      fs.unlinkSync(uniqidPhoto)
      // renvoi du profil à jour :
      res.json(user)
  });
  
module.exports = router;
