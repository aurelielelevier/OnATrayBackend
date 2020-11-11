var express = require('express');
var router = express.Router();
var talentModel = require('../model/talents')
var restaurantModel = require('../model/restaurants')

router.post(`/recherche-liste-restaurants`, async function(req, res, next){
    var donnees = JSON.parse(req.body.restaurant)
    console.log('donnees', donnees)
    var responseAenvoyer = await restaurantModel.find(
       { 
        adresselgtlat: {
          $geoIntersects: {
             $geometry: {
                type: "Polygon" ,
                coordinates: [donnees.zone],
             }
          }
        },
        typeOfFood : {$in: donnees.cuisine},
        typeOfRestaurant: { $in: donnees.ambiance},
        clientele: { $in: donnees.type},
        pricing :{ $in: donnees.prix} 
      }
    )
    var user = await talentModel.findOne({token:req.body.token})
    if (user.wishlistTalent){
      var whishlist = user.wishlistTalent
    } else{
     var whishlist = []
    } 
    res.json({liste : responseAenvoyer, whishlist: whishlist})
  })

  router.post('/whishlist', async function( req, res, next){
    var user = await talentModel.findOne({token: req.body.token})
    var restaurant = await restaurantModel.findOne({_id: req.body.id})
    if(user.wishlistTalent.includes(restaurant._id)){
      await talentModel.updateOne({token: req.body.token}, { $pull: { wishlistTalent: { $in:  `${req.body.id}` }} })
    } else {
      await talentModel.updateOne({token: req.body.token}, {$addToSet:{ wishlistTalent: req.body.id}})
    }
    
    var response = await restaurantModel.find()
    var userAjour = await talentModel.findOne({token: req.body.token})
    res.json({liste :response, whishlist: userAjour.wishlistTalent})
  })

  module.exports = router;