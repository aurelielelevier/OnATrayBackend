const mongoose = require('mongoose')

const experienceSchema = mongoose.Schema({
        
		markT1:Number,
		markT2:Number,
		markT3:Number,
		markT4:Number,
		markT5:Number,
		markR1:Number,
		markR2:Number,
		markR3:Number,
		markR4:Number,
		markR5:Number,
		startingDate:String,
		endingDate:String,
		job:String,
		firm : String, 
		city :String
		    
})

const experienceModel = mongoose.model('experience', experienceSchema)

module.exports = experienceModel