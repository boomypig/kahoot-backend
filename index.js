const express = require("express");
const cors = require("cors");
const model  = require("./model");
const session = require("express-session")

const app = express();
app.use(cors());
app.use(express.json());
app.use(session({
    secret:"fdanhkvhcuxvhxoiubebayfhdoygbvzsbheouiahofualdijfuhaoiudhfaoiuhoaiuhiauhsdiuahsihafisuhfoiuahsdoiufhaidfhaoiufh",
    saveUninitialized: true,
    resave: false,
}))

app.get("/users",async (request, response) => {
    try{
        let users = await model.User.find({},{password:0});
        response.send(users);
    }catch(error){
        response.status(500).send("Bad request")
    }
})


app.post("/users", async (request, response) => {
    try{
        let newUser = await new model.User({
            email: request.body.email,
            name: request.body.name,
        });
        await newUser.setPassword(request.body.password);
        const error = await newUser.validateSync();
        if(error){
            console.log(error);
            return response.status(422).send(error);
        }
        await newUser.save();
        response.status(201).send("new user created");
    }catch(error){
        console.log(error);
        response.status(500).send(error);
    }
});


app.post("/session",  async (request,response) => {
    try{
        //STEP 1
        let user = await model.User.findOne({email: request.body.email})
        //STEP 2 if the user sends a email not in the databse
        if (!user){
            return response.status(401).send("AUTHENTICSTION FALIED")
        }
        //STEP 3 check if they gave us the right password
        let isGoodPassword = await user.verifyPassword(request.body.password);
        if (!isGoodPassword){
            return response.status(401).send("AUTHENTICSTION FALIED")
        }
        response.status(201).send("YOURE LOgGED IN");

        // set the cookie
        request.session.userID = user._id;

    }catch(error){
        response.status(500);
        console.log(error)
    }
})



app.listen(8080,function(){
    console.log("server is running on http://localhost:8080...");
})