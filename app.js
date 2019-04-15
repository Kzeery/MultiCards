const mainSocketListener = require("./exports/mainsocket"),     
      session            = require("express-session"),
      LocalStrategy      = require("passport-local"),
      flash              = require("connect-flash"),
      User               = require("./models/user"),
      bodyParser         = require("body-parser"),
      socketIO           = require("socket.io"),
      mongoose           = require("mongoose"),
      passport           = require("passport"), 
      express            = require("express"),
      http               = require("http"),
      app                = express();
                           require('dotenv').config();

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.DATABASEURL);
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(flash());
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
const server  = http.Server(app),
      io      = socketIO(server),
      urls    = [];

mainSocketListener(io, urls);


app.get("/", function (req, res) {
    res.render("index");
});
app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    var newUser = new User({username: req.body.username})
    User.register(newUser, req.body.password, function(err, user) {
        if(err) {
            req.flash("error", err.message);
            console.log(err);
            return res.redirect("/");
        }
        passport.authenticate("local")(req, res, function() {
            req.flash("success", "Welcome to multicards " + user.username);
            res.redirect("/");
        });
    });
});
app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}),function(req, res) {
});

app.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/");
});

app.get("/matches/:id", function(req, res) {
    User.findById(req.params.id).populate("matches").exec(function(err, user) {
        if(err || !user) {
            req.flash("error", "No user with that ID found!");
            return res.redirect("/");
        }
        var isFriend = false;
        if(req.user) {
            user.friends.forEach(function(friend) {
                if(friend.id == req.user.id) {
                    isFriend = true;
                }
            });
        }
        setTimeout(function() {
            res.render("matches", {user: user, isFriend: isFriend});
        }, 100)
    });
    
});

app.get("/game/:id", function(req, res) {
    if(urls.includes(req.params.id)) {
        return res.render("game");
    }
    res.redirect("/");
});

server.listen(process.env.PORT, process.env.IP, function() {
    console.log("server has started!");
});