var express = require('express');
var router = express.Router();
var talentModel = require('../model/talents')
var restaurantModel = require('../model/restaurants')

router.post('/recherche-liste-talents', async function(req,res,next){
   var données= JSON.parse(req.body.criteres)
    var restaurant = await restaurantModel.findOne({token:req.body.token})
    var metier = [données.posterecherché]
    var contrat = [données.typedecontrat]
    console.log('CONTRATS',metier)
    console.log('POSTES', contrat)
    
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
        console.log(('chargement avec tri',responseAenvoyer))
            
        let restaurantwishlistexpand = await restaurantModel.findOne({token:req.body.token}).populate('wishlistRestaurant').exec()
        let restaurantwishlistid = await restaurantModel.findOne({token:req.body.token})
  
      res.json({liste:responseAenvoyer,restaurantwishlist:restaurantwishlistexpand,restaurantwishlistid:restaurantwishlistid.wishlistRestaurant})
     })
    
     
router.post('/wishlist', async function (req,res,next){
var user = await restaurantModel.findOne({token: req.body.token})
    var talent = await talentModel.findOne({_id: req.body.id})

    if(user.wishlistRestaurant.includes(talent.id)){ 
            await restaurantModel.updateOne({token: req.body.token}, { $pull: {wishlistRestaurant:{ $in:`${req.body.id}` }} })
    console.log('retrait wishlist')  
    await talentModel.findByIdAndUpdate(talent.id,{$inc:{countFave:-1,"metrics.orders": 1}})
    } else {
        await restaurantModel.updateOne({token: req.body.token}, {$addToSet:{ wishlistRestaurant:req.body.id}})
        await talentModel.findByIdAndUpdate(talent.id,{$inc:{countFave:+1,"metrics.orders": 1}})
    console.log('ajout wishlist')}

    var responseAenvoyer=await talentModel.find().populate('formation').populate('experience').exec()
    var restaurant= await restaurantModel.findOne({token:req.body.token})

res.json({profil: restaurant,liste: responseAenvoyer})
})

module.exports = router;