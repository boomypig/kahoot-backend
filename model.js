const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const { scheduler } = require("timers/promises")
const { Schema } = mongoose

mongoose.connect(process.env.DATABASE)

const UserSchema = Schema({
    email:{
        type:String,
        required:[true,"User MUST have an email"]
    },
    name:{
        type:String,
    },
    password:{
        type:String,
        required:[true, "User MUST have a password"]
    },
})

const QuizSchema = Schema ({
    title: {
        type:String,
        required:[true,"Must have a Title"],
     },
     owner: {
        type: Schema.Types.ObjectId,
        ref:"User",
        required: [true,"A quiz needs a person"]
     },

     description: String,

     questions: [
        {
        questionText:{
            type:String,
            required:[true,"Question requires text"]
        },
        possibleChoices:[
            {
            answerText:{
                type:String,
                required: [true,"Need text"]
            },
            isCorrect:{
                type: Boolean,
                required:[true,"AN answer must be given"]
            },
        }]
     }]
 })

UserSchema.methods.setPassword = async function(plainPassword) {
    try{
        let encryptedPassword = await bcrypt.hash(plainPassword,12);
        this.password = encryptedPassword;
    }catch(error){
        console.log("INVALIDE")
    }
}
UserSchema.methods.verifyPassword = async function(password){
    let isGood = await bcrypt.compare(password,this.password);
    return isGood;
}
const User = mongoose.model("User", UserSchema)
const Quiz = mongoose.model("Quiz",QuizSchema)

module.exports = {
    User,
    Quiz,
}