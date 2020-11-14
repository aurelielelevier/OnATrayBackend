var express = require('express');
var router = express.Router();
var talentModel = require('../model/talents')
var restaurantModel = require('../model/restaurants')

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

    if(user.wishlistRestaurant.includes(talent.id)){ 
        await restaurantModel.updateOne({token: req.body.token}, { $pull: {wishlistRestaurant:{ $in:`${req.body.id}` }} })
        console.log('retrait wishlist')  
   // await talentModel.findByIdAndUpdate(talent.id,{$inc:{countFave:-1,"metrics.orders": 1}})
    } else {
        await restaurantModel.updateOne({token: req.body.token}, {$addToSet:{ wishlistRestaurant:req.body.id}})
    //    await talentModel.findByIdAndUpdate(talent.id,{$inc:{countFave:+1,"metrics.orders": 1}})
        console.log('ajout wishlist')}

    var responseAenvoyer= await talentModel.find().populate('formation').populate('experience').exec()
    var restaurant= await restaurantModel.findOne({token:req.body.token}).populate('wishlistRestaurant').exec()
    console.log(restaurant.wishlistRestaurant)

res.json({profil: restaurant,liste: responseAenvoyer})
})

router.get('/affiche-whishlist/:token', async function( req, res, next){
    // cherche la whishlist du restaurant et implémente les données des talents, retourne la whishlist avec les 
    // informations des restaurants pour l'affichage des informations
    var user = await restaurantModel.findOne({token: req.params.token})
    var wishlist = user.wishlistRestaurant
    var liste = await talentModel.find({_id : {$in: wishlist}}).populate('formation').populate('experience').exec()

    console.log(liste)
    res.json(liste)
  });

module.exports = router;