var express = require('express');
var router = express.Router();
var talentModel = require('../model/talents');
var restaurantModel = require('../model/restaurants');
var experienceModel = require('../model/experience');
var formationModel = require('../model/formation');
const {request} = require('express');
var uid2 = require('uid2');
var SHA256 = require("crypto-js/sha256");
var encBase64 = require("crypto-js/enc-base64");

const zoneFrance= [
  [ -5.3173828125, 48.458124202908934 ],
  [ 2.1313476562500004, 51.26170001449684 ],
  [ 8.811035156250002, 48.90783374365477 ],
  [ 7.998046875000001, 43.70709714273101 ],
  [ 3.2080078125000004, 42.228008913641865 ],
  [ 1.4941406250000002, 42.293056273848215 ],
  [ -2.0214843750000004, 43.06838615478111 ],
  [ -5.3173828125, 48.458124202908934 ]
];

var polygoneFrance = {
  type: "Polygon" ,
  coordinates: [
    zoneFrance
  ]
};

router.post('/createAccount', async function(req,res,next){
    var salt = uid2(32);
    var talentToCheck = await talentModel.findOne({email:req.body.talentEmail});
    var avatar = 'https://res.cloudinary.com/dpyqb49ha/image/upload/v1604324805/mucu7fy5dbhrxmhtf1dc.jpg';
    if(talentToCheck === null) {
      var newTalent = await new talentModel({
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        email : req.body.email,
        password : SHA256(req.body.password + salt).toString(encBase64),
        token: uid2(32), 
        salt : salt,
        phone : req.body.phone,
        avatar:avatar,
        lookingForJob:false,
        working:false,
        speakLangage:[],
        adress:'',
        adresselgtlat: {
          type: "Point" ,
          coordinates: [2.33,48.33]},
        polygone: polygoneFrance,
        perimetre :zoneFrance,
        lookingJob:[],
        typeofContract: [],
        wishlistTalent:[],
        experience:[],
        formation:[],
        chatRoom:[],
        countFave:0,
      })
      var talentSaved = await newTalent.save();
      if(talentSaved){
        res.json({profil: talentSaved})
      }else{
        res.json(false)
      }
    }
  })

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
                coordinates: [donnees.zone.coordinates],
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
   
    res.json({liste : responseAenvoyer, profil:user})
  })

router.post('/wishlist', async function( req, res, next){
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
  res.json(user.wishlistTalent)
});

router.put('/informations', async function(req,res,next){
  // conversion des dates au format date :
  dateFormat = function (date) {
    let day = ("0" + date.getDate()).slice(-2);
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let year = date.getFullYear();
    let dateFormat = day+"/"+month+"/"+year;
    return dateFormat 
  }
  
  var job = JSON.parse(req.body.job)
  var langage = JSON.parse(req.body.langage)
  var typeofContract=JSON.parse(req.body.contrat)

  // mise à jour du profil talent avec les information du body :
  await talentModel.updateOne({token:req.body.token},{speakLangage:langage, working:req.body.poste, lookingForJob: req.body.recherche, lookingJob:job, typeofContract:typeofContract})
  
  // création des formations avec le tableau reçu et mise à jour du profil talent en ajoutant l'id en clé étrangère:
  var formation = JSON.parse(req.body.formation)
  var experience = JSON.parse(req.body.experience)

  for (let i=0;i<formation.length;i++){
  var newFormation = await new formationModel({
  school : formation[i].school,
  diploma : formation[i].diploma,
  endingDate : dateFormat(new Date(formation[i].year)),
  city : formation[i].city
  })
  await newFormation.save();
  await talentModel.updateOne({token:req.body.token},{$addToSet:{formation:newFormation.id}})
  }
  // création des expériences avec le tableau reçu et mise à jour du profil talent en ajoutant l'id en clé étrangère:
  for(let i=0; i<experience.length;i++){
    var newExperience = await new experienceModel({
    firm : experience[i].firm,
    city : experience[i].city,
    startingDate : dateFormat(new Date(experience[i].rangeDate[0])),
    endingDate : dateFormat(new Date(experience[i].rangeDate[1])),
    job: experience[i].job,
    })
  await newExperience.save();
  await talentModel.updateOne({token:req.body.token},{$addToSet:{experience:newExperience.id}})
  }
  var user = await talentModel.findOne({token:req.body.token}).populate('formation').populate('experience').populate('wishlistTalent').exec();
  // renvoi du profil à jour :
  res.json(user)
})

router.post('/envoi-secteur', async function(req, res, next){
  // recherche du talent avec son token et enregistrement de l'adresse, du perimètre et du polygone
  var lnglat = JSON.parse(req.body.lnglat)
  if(req.body.liste){
    var listePoints = await JSON.parse(req.body.liste);
    listePoints.push(listePoints[0]);
  } else {
    var listePoints = zoneFrance
  }
  
  await talentModel.updateOne({ token: req.body.token }, {perimetre: listePoints, adress:req.body.adresse, adresselgtlat:lnglat, polygone: {
    type: "Polygon" ,
    coordinates: [
      listePoints
    ]
  }})
  var user = await talentModel.findOne({token:req.body.token}).populate('formation').populate('experience').populate('wishlistTalent').exec();
  // renvoi du profil à jour :
  res.json(user)
});
  
module.exports = router;