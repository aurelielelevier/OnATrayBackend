var mongoose = require('mongoose');

var options = {
    connectTimeoutMS: 5000,
    useUnifiedTopology : true,
    useNewUrlParser: true,
}

mongoose.connect(`mongodb+srv://${process.env.MONGODB}`,
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