require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const passport = require("passport");
const https = require("https");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

mongoose.connect(process.env.MONGODB_URL, {useNewUrlParser: true, useUnifiedTopology: true}, err => {
  console.log("connected");
});
mongoose.set("useCreateIndex", true);

const PORT = 3000 || process.env.port;

const app = express();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());
app.use(passport.session());

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  country: String,
  city: String,
  isVerified: Boolean,
  IDimg:
  {
    name: String,
    img:
    {
      data: Buffer,
      contentType: String
    }
  }
});

const User = mongoose.model("User", userSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads")
  },
  filename: (req, file, cb) => {
    cb(null, "ID -" + Date.now())
  }
});

const upload = multer({storage: storage});

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

passport.use(new LinkedInStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/linkedin/callback",
  scope: ['r_emailaddress', 'r_liteprofile', "w_member_social"],
}, function(accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    globalThis.token = accessToken
    return done(null, profile);
  });
}));

app.get('/auth/linkedin',
  passport.authenticate('linkedin', { state: 'SOME STATE'  }),
  function(req, res){
    //function will not be called
});

app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
  successRedirect: '/callback',
  failureRedirect: '/about'
}));

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.post("/", upload.single("image"), (req, res, next) => {
    globalThis.fName = req.body.fname;
    globalThis.lName = req.body.lname;
    globalThis.email = req.body.email;
    globalThis.country = req.body.country;
    globalThis.city = req.body.city;

    const user = new User( {
      firstName: fName,
      lastName: lName,
      email: email,
      country: country,
      city: city,
      isVerified: false,
      IDimg:
      {
        name: fName + lName + "ID",
        img:
        {
          data: fs.readFileSync(path.join(__dirname + "/uploads/" + req.file.filename)),
          contentType: "image/jpeg"
        }
      }
    })

    user.save();
    console.log("posted");
    res.redirect("/auth/linkedin/callback")
    res.end();
})


app.get("/callback", (req, res) => {
  const options = {
    host: 'api.linkedin.com',
    path: '/v2/me',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'cache-control': 'no-cache',
      'X-Restli-Protocol-Version': '2.0.0'
    }
  };

  const profileRequest = https.request(options, function(response) {
  let data = '';
  response.on('data', (chunk) => {
    data += chunk;
  });

  response.on('end', () => {
    const profileData = JSON.parse(data);
    const firstName = profileData.localizedFirstName;
    const lastName = profileData.localizedLastName;
    console.log(firstName);
    console.log(lastName);
    console.log(fName);
    console.log(lName);
    var isMatched = false;
    var result = "";

    if (firstName === fName && lastName === lName) {
      isMatched = true;
      result = "The information you have entered matches your LinkedIn account";
      user.updateOne({email: email}, {$set: {isVerified: true}});
      user.save();
      res.render("callback", {isMatched: isMatched, result: result});
    } else {
      result = "The information you have entered is incorrect";
      res.render("callback", {isMatched: isMatched, result: result});
    }

    });
  });
  profileRequest.end();
});

app.get("/camera", (req, res) => {
  res.render("camera");
})

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.listen(PORT, () => {
    console.log("Server is running...");
})
