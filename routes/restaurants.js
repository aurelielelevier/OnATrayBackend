var express = require('express');
var router = express.Router();
var talentModel = require('../model/talents');
var restaurantModel = require('../model/restaurants');
var uid2 = require('uid2');
var SHA256 = require("crypto-js/sha256");
var encBase64 = require("crypto-js/enc-base64");

router.post('/createAccount', async function(req,res,next){
    // Création des profils, ajout en base de donnée avec un avatar non personnalisé, sécurisation du mot de passe
    var avatar = "https://cdn.pixabay.com/photo/2016/11/29/12/54/bar-1869656_1280.jpg"
    var salt = uid2(32)
    var restauToCheck = await restaurantModel.findOne({email:req.body.restaurantEmail})
    if(restauToCheck === null){
      var newRestau = await new restaurantModel({
        name : req.body.restaurantName,
        email : req.body.restaurantEmail,
        salt : salt,
        password : SHA256(req.body.restaurantPassword + salt).toString(encBase64),
        token: uid2(32), 
        siret : req.body.restaurantSiret,
        photo : avatar ,
        website : req.body.restaurantWebsite,
        phone : req.body.phoneRestaurant,
        adress : req.body.restaurantAdress,
        clientele: [],
        pricing:4,
        typeOfRestaurant:[],
        typeOfFood:[],
        wishlistRestaurant:[],
        experience:[],
        adresselgtlat: JSON.parse(req.body.lnglat),
        chatRoom:[],
      })
      var restauSaved = await newRestau.save();
      if(restauSaved){
        res.json(restauSaved)
      }else{
        res.json(false)
      }
    }
});

router.put('/informations', async function(req,res,next){
    // recherche du restaurant avec son token et mise à jour des informations :
    var clientele = JSON.parse(req.body.clientele)
    var type = JSON.parse(req.body.restaurantOption)
    var cuisine = JSON.parse(req.body.foodOption)
    var prix = req.body.pricing
    await restaurantModel.updateOne({token:req.body.token},{clientele: clientele, typeOfRestaurant : type, typeOfFood: cuisine, pricing : prix})
    var restaurant = await restaurantModel.findOne({token:req.body.token})
    // renvoi du profil à jour :
    res.json(restaurant)
})

router.post('/recherche-liste-talents', async function(req,res,next){
   var données= JSON.parse(req.body.criteres)
    var restaurant = await restaurantModel.findOne({token:req.body.token})
    var metier = [données.posterecherché]
    var contrat = [données.typedecontrat]
    // Permet de récupérer les talents à afficher en fonction des fitlres appliqués
    // Condition avec toutes les postes
    var responseAenvoyer = await talentModel.find({
        lookingJob:{$in:[données.posterecherché]},
        typeofContract:{$in:[données.typedecontrat][0]},
        polygone: {
            $geoIntersects: {
            $geometry: {
                type: "Point" ,
                coordinates: restaurant.adresselgtlat.coordinates,
            }
            }
        }
        }).populate('formation').populate('experience').exec()
            
        let restaurantwishlistexpand = await restaurantModel.findOne({token:req.body.token}).populate('wishlistRestaurant').exec()
        
      res.json({profil: restaurantwishlistexpand, liste: responseAenvoyer})
     })
    
     
router.post('/wishlist', async function (req,res,next){
    var user = await restaurantModel.findOne({token: req.body.token})
    var talent = await talentModel.findOne({_id: req.body.id})
    // vérification si l'Id est déja en wishlist:
    if(user.wishlistRestaurant.includes(talent.id)){ 
        // suppression si oui :
        await restaurantModel.updateOne({token: req.body.token}, { $pull: {wishlistRestaurant:{ $in:`${req.body.id}` }} })
    } else {
        // ajout si non :
        await restaurantModel.updateOne({token: req.body.token}, {$addToSet:{ wishlistRestaurant:req.body.id}})
    }
    var responseAenvoyer= await talentModel.find().populate('formation').populate('experience').exec()
    var restaurant= await restaurantModel.findOne({token:req.body.token}).populate('wishlistRestaurant').exec()
    // renvoi du profil du restaurant à jour et de la wishlist avec les informtions complétées des talents:
    res.json({profil: restaurant, liste: responseAenvoyer})
})

router.get('/affiche-whishlist/:token', async function( req, res, next){
    // cherche la whishlist du restaurant et implémente les données des talents, retourne la whishlist avec les 
    // informations des restaurants pour l'affichage des informations
    var user = await restaurantModel.findOne({token: req.params.token})
    var wishlist = user.wishlistRestaurant
    var liste = await talentModel.find({_id : {$in: wishlist}}).populate('formation').populate('experience').exec()
    // renvoi de la liste :
    res.json(liste)
  });

module.exports = router;