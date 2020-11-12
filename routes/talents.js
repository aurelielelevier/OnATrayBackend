var express = require('express');
var router = express.Router();
var talentModel = require('../model/talents')
var restaurantModel = require('../model/restaurants')

router.post(`/recherche-liste-restaurants`, async function(req, res, next){
  // tri dans la liste des restaurants à retourner en fonction des différents critères, vérifie si
  // les arguments donnés dans les champs input sont présents dans les tableaux des restaurants
  // tri également selon le périmètre défini
  // retourne la liste des restaurants et le profil du talent 
    var donnees = JSON.parse(req.body.restaurant)
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
    var user = await talentModel.findOne({token:req.body.token}).populate('wishlistTalent').populate('experience').populate('formation').exec()
    if (user.wishlistTalent){
      var whishlist = user.wishlistTalent
    } else{
     var whishlist = []
    } 
    res.json({liste : responseAenvoyer, profil:user})
  })

  router.post('/whishlist', async function( req, res, next){
    var user = await talentModel.findOne({token: req.body.token})
    var restaurant = await restaurantModel.findOne({_id: req.body.id})
    // vérification si l'Id du restaurant est comprise dans le tableau de la whishlist du talent, 
    // retrait si déjà présent,
    // ajout si non présent.
    if(user.wishlistTalent.includes(restaurant._id)){
      await talentModel.updateOne({token: req.body.token}, { $pull: { wishlistTalent: { $in:  `${req.body.id}` }} })
    } else {
      await talentModel.updateOne({token: req.body.token}, {$addToSet:{ wishlistTalent: req.body.id}})
    }
    var response = await restaurantModel.find()
    var userAjour = await talentModel.findOne({token: req.body.token}).populate('experience').populate('formation').populate('wishlistTalent').exec()
    // renvoie la liste des restaurants et le profil du talent mis à jour
    res.json({liste :response, profil:userAjour})
  })

  router.get('/affiche-whishlist/:token', async function( req, res, next){
    // cherche la whishlist du talent et implémente les données des restaurants, retourne la whishlist avec les 
    // informations des restaurants pour l'affichage des informations
    var user = await talentModel.findOne({token: req.params.token}).populate('wishlistTalent').exec()
    console.log(user.wishlistTalent.length)
   res.json(user.wishlistTalent)
  });

  module.exports = router;