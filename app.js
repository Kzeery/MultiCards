const mainSocketListener = require("./exports/mainsocket"), // Websocket listener for the index pages
      session            = require("express-session"), // Gets the users session
      MongoDBStore       = require("connect-mongodb-session")(session), // Stores the users session in the database
      LocalStrategy      = require("passport-local"), // For authentication
      flash              = require("connect-flash"), // For giving error messages to users
      User               = require("./models/user"), // Mongoose user model
      bodyParser         = require("body-parser"), // Saves information from post requests in req.body
      socketIO           = require("socket.io"), // Web socket package
      mongoose           = require("mongoose"), // For interacting with mongoDB
      passport           = require("passport"), // Authentication
      express            = require("express"), // Routing
      http               = require("http"), // Making the express server interact with SocketIO
      app                = express(); // Creating an express app
                           require('dotenv').config(); // Saves all environment variables set in file ".env" to process.env

// App setup block
// // Mongoose setup
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
// // Connecting stored session information to the database
var store = new MongoDBStore({
    uri: process.env.DATABASEURL,
    collection: 'mySessions'
});
store.on('error', function(err) {
    console.log(err);
});
// // Connecting mongoose to the database
mongoose.connect(process.env.DATABASEURL);
// // Setting up body parser, and ejs which is the html template used in this app
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
// // All files use their assets as dir /public
app.use(express.static(__dirname + "/public"));
// // Setting up flash for errors
app.use(flash());
// // Setting up session middleware, max cookie age, and storing it in the database
app.use(require("express-session")({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    store: store
}));
// // Passport authentication setup with the User model.
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// // Middleware for all rendered files. If there is a user logged in, it will be saved as currentUser, error as error, and success as success.
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
// // Initializing the server and socketIO as well as a list of accessible game urls.
const server  = http.Server(app),
      io      = socketIO(server),
      urls    = [];


// Calling the mainSocketListener for all pages. This is what allows users to get notifications and updates in real time about online friends, friend requests, etc...
mainSocketListener(io, urls);

// Show the index page
app.get("/", function (req, res) {
    res.render("index");
});

// Show the how to play page
app.get("/howtoplay", function(req, res) {
    res.render("howtoplay");
});

// Show the about page
app.get("/about", function(req, res) {
    res.render("about");
});

// Show the register page
app.get("/register", function(req, res) {
    res.render("register");
});

// Creating a new user
app.post("/register", function(req, res) {
    // Getting info from the post request
    var newUser = new User({username: req.body.username});
    // Create a user with their username and password
    User.register(newUser, req.body.password, function(err, user) {
        // If they cannot create a user with those credentials, show them an error and redirect them back to register
        if(err) {
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        // Otherwise, authenticate their credentials and redirect them back while telling them that they were successful.
        passport.authenticate("local")(req, res, function() {
            req.flash("success", "Welcome to multicards " + user.username);
            res.redirect("/");
        });
    });
});

// Show the login page
app.get("/login", function(req, res) {
    res.render("login");
});

// Check the credentials. If they entered valid user credentials, redirect them to the home page. If not, show them an error and redirect them back to the login page.
app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}),function(req, res) {
});

// Log the user out
app.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/");
});

// Show the match history for the user with the id in /matches/{id}
app.get("/matches/:id", function(req, res) {
    // Find a user in the database with that id
    User.findById(req.params.id).populate("matches").exec(function(err, user) { // Each user only contains the Match id for their matches played. Populate function shows the rest of the information.
        // If the user is not found, throw an error and redirect 
        if(err || !user) {
            req.flash("error", "No user with that ID found!");
            return res.redirect("/");
        }
        // Check if the logged in user is a friend of the user with that match history. (This is to show a button to add the friend if not).
        var isFriend = false;
        if(req.user) {
            user.friends.forEach(function(friend) {
                if(friend.id == req.user.id) {
                    isFriend = true;
                }
            });
        }
        // Getting around async with setTimeout. Render the match history page with the user information and whether or not the current user is a friend of that user.
        setTimeout(function() {
            res.render("matches", {user: user, isFriend: isFriend});
        }, 100);
    });
});
// Render the game page if and only if the url id is valid. Urls only open when a user accepts a game invite and closes after. No random user can join that website after.
app.get("/game/:id", function(req, res) {
    if(urls.includes("/game/" + req.params.id)) {
        return res.render("game");
    }
    res.redirect("/");
});

// Starting the server
server.listen(process.env.PORT, process.env.IP, function() {
    console.log("server has started!");
});