var express = require('express');
var router = express.Router();
var uniqid = require('uniqid');
var uid2 = require("uid2");
var SHA256 = require("crypto-js/sha256");
var encBase64 = require("crypto-js/enc-base64");

var talentModel = require('../model/talents')
var restaurantModel = require ('../model/restaurants')
var formationModel = require('../model/formation')
var experienceModel = require('../model/experience')

router.post('/sign_in', async function(req,res,next){
  
  //On cherche d'abord dans la base de données talents (logiquement leur nombre sera superieur)
    var talentToSearch = await talentModel.findOne({email : req.body.email})
    if(talentToSearch){
      var hash = SHA256(req.body.password + talentToSearch.salt).toString(encBase64)
      if (talentToSearch.password == hash){
        console.log(talentToSearch.wishlistTalent)
        talentToSearch = await talentModel.findOne({email : req.body.email}).populate('wishlistTalent').populate('experience').populate('formation').exec()
        res.json({result:true, type:'talent', token: talentToSearch.token, adresse: talentToSearch.adresselgtlat, zone: talentToSearch.perimetre, profil: talentToSearch, pseudo: talentToSearch.firstName})
      }else {
        res.json({result : 'Error'})
      }
    }
    //Sinon on cherche dans base de données restaurants
    else {
      var restauToSearch = await restaurantModel.findOne({email : req.body.email})
      if(restauToSearch){
        var hashh = SHA256(req.body.password + restauToSearch.salt).toString(encBase64)
        if (restauToSearch.password == hashh){
          console.log(restauToSearch)
          res.json({result : true, type:'restaurant', token: restauToSearch.token, adresse: restauToSearch.adresselgtlat, profil: restauToSearch, pseudo: restauToSearch.name})
        }else{
          res.json({result : 'Error'})
        }
      }else{
        res.json({result : 'Error'})
      }
    }
  })

router.post('/connect', async function(req,res,next){
  //On cherche la présence de l'utilisateur dans la base de données talents :
    var talentToSearch = await talentModel.findOne({token : req.body.token}).populate('experience').populate('formation').exec()
    if(talentToSearch){
      
      res.json({result:true, type:'talent', token: talentToSearch.token, adresse: talentToSearch.adresselgtlat, zone: talentToSearch.perimetre, profil: talentToSearch, pseudo: talentToSearch.firstName})
    }
    //Sinon on cherche dans base de données restaurants :
    else{
      res.json({result : true, type:'restaurant', token: restauToSearch.token, adresse: restauToSearch.adresselgtlat, profil: restauToSearch, pseudo: restauToSearch.name})
    }
  })
  
module.exports = router;
