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

app.use(express.static("public"))


//the purpose of this middleware is to check if a rquest has a session and
// that session has a  userID field that connects to a suer in our database

async function Authmiddleware(request,response,next){
//STEP 1 check if htey have a session
  if(request.session && request.session.userID){
    //step 2 check if that session.userID connects to a user in our database
    let user = await model.User.findOne({_id: request.session.userID});
    if(!user){
      return response.status(401).send("Unathenticated");
    }
    // if they are authenticated just pass them to the endpoint
    request.user = user;
    next();
  }else{
    return response.status(401).send("unathenticated")

  }
}

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

app.get('/session', Authmiddleware,(response,request) => {
  response.send(request.session);
})

app.put("/quizzes/:quizID", Authmiddleware, async function (req, res) {
  try {
    let quiz = await model.Quiz.findOne({
      _id: req.params.quizID,
      owner: req.user._id,
    }).populate("owner");

    if (!quiz) {
      res.status(404).send("Quiz not found");
      return;
    }

    console.log(req.user._id);
    console.log(quiz.owner._id);
    if (req.user._id.toString() !== quiz.owner._id.toString()) {
      res.status(403).send("Not Authenticated");
      return;
    }

    quiz.title = req.body.title;
    quiz.description = req.body.description;
    quiz.questions = req.body.questions;

    const error = await quiz.validateSync();
    if (error) {
      res.status(422).send(error);
      console.log(error);
      return;
    }
    await quiz.save();
    res.status(204).send();
  } catch (error) {
    console.log(error);
    res.status(422).send(error);
  }
});
app.delete("/session", function(req,res){
  req.session.userID = undefined
  res.status(204).send();
})

app.delete("/quizzes/:quizID", Authmiddleware, async function (req, res) {
  try {
    let isDeleted = await model.Quiz.findOneAndDelete({
      _id: req.params.quizID,
      owner: req.user._id,
    });
    if (!isDeleted) {
      res.status(404).send("Quiz Not Found");
      return;
    }
    res.status(204).send("Removed");
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

app.post("/quizzes", Authmiddleware, async function (req, res) {
    try {
        console.log(req.session)
      const newQuiz = await new model.Quiz({
        title: req.body.title,
        description: req.body.description,
        questions: req.body.questions,
        owner: req.session.userID
      });
       
      const error = await newQuiz.validateSync();
      if (error) {
        res.status(422).send(error);
        console.log(error);
        return;
      }
  
      await newQuiz.save();
      res.status(201).send("Created quiz.");
    } catch (error) {
      console.error(error);
      res.status(422).send(error);
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

         // set the cookie
        request.session.userID = user._id;
        request.session.name = user.name;
        response.status(201).send(request.session);
    }catch(error){
        response.status(500);
        console.log(error)
    }
})
app.get("/quizzes", async function (req, res) {
    try {
      let quizzes = await model.Quiz.find();
      if (!quizzes) {
        res.status(404).send("Quizzes Not Found");
        return;
      }
      res.json(quizzes);
    } catch (error) {
      console.log(error);
      res.status(404).send("Quizzes Not Found");
    }
  });
  
  app.get("/quizzes/:quizID", async function (req, res) {
    try {
      console.log(req.params.quizID);
      let quiz = await model.Quiz.find({ _id: req.params.quizID });
      console.log(quiz);
      if (!quiz) {
        console.log("Quiz not found.");
        res.status(404).send("Quiz not found.");
        return;
      }
  
      res.json(quiz);
    } catch (error) {
      console.log(error);
      console.log("Bad request (GET quiz).");
      res.status(400).send("Quiz not found.");
    }
  });
  



app.listen(8080,function(){
    console.log("server is running on http://localhost:8080...");
})