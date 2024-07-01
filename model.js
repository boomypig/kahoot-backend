const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
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

module.exports = {
    User,
}