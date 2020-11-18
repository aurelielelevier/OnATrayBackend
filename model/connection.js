const nameMongoDB = process.env.NAME_MONGODB
const password = process.env.PASSWORD
const collection = process.env.COLLECTION

var mongoose = require('mongoose');

var options = {
    connectTimeoutMS: 5000,
    useUnifiedTopology : true,
    useNewUrlParser: true,
}

mongoose.connect(`mongodb+srv://${nameMongoDB}:${password}@cluster0.5gyqg.mongodb.net/${collection}?retryWrites=true&w=majority`,
    options,
    function(err){
        if(!err){
            console.log('connecté Mongo DB')
        } else {
            console.log(err)
        }
    } 
)

module.exports = mongoose