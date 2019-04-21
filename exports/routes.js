const express = require("express"),
      router  = express.Router(),
      passport = require("passport"),
      User     = require("../models/user");

router.get("/", function (req, res) {
    res.render("index");
});

// Show the how to play page
router.get("/howtoplay", function(req, res) {
    res.render("howtoplay");
});

// Show the about page
router.get("/about", function(req, res) {
    res.render("about");
});

// Show the register page
router.get("/register", function(req, res) {
    res.render("register");
});

// Creating a new user
router.post("/register", function(req, res) {
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
router.get("/login", function(req, res) {
    res.render("login");
});

// Check the credentials. If they entered valid user credentials, redirect them to the home page. If not, show them an error and redirect them back to the login page.
router.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}),function(req, res) {
});

// Log the user out
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/");
});

// Show the match history for the user with the id in /matches/{id}
router.get("/matches/:id", function(req, res) {
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


module.exports = router;