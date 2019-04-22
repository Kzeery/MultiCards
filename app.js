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
const router = require("./exports/routes");
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
if(process.env.NODE_ENV != "Development") {
    app.use(function(req, res, next) {
        if(!req.secure) {
            res.redirect("https://" + req.url);
        }
        next();
    });
}
// // Initializing the server and socketIO as well as a list of accessible game urls.
const server  = http.Server(app),
      io      = socketIO(server),
      urls    = [];


// Calling the mainSocketListener for all pages. This is what allows users to get notifications and updates in real time about online friends, friend requests, etc...
mainSocketListener(io, urls);

app.use("/", router);

// Render the game page if and only if the url id is valid. Urls only open when a user accepts a game invite and closes after. No random user can join that website after.
app.get("/game/:id", function(req, res) {
    if(urls.includes("/game/" + req.params.id)) {
        return res.render("game");
    }
    res.redirect("/");
});

app.get("*", function(req, res) {
    req.flash("error", "That was not a valid route. Redirected back home.")
    return res.redirect("/");
});
// Starting the server
server.listen(process.env.PORT, process.env.IP, function() {
    console.log("server has started!");
});