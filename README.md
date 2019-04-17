# Project 03

## For CS1XA3 Server
### How to run the project on the server
To run the project on the server, simply go over to the Project03 directory and type in "node app.js" and the server will start. You can then head over to http://mac1xa3.ca/e/kzeery to visit the index page.
## To view the app online
### How to find the app online
To see the app online, simply go to http://www.multicards.tk. It has the exact same functionality as the CS1XA3 server version.

## Basic Features
### User Creation
This app uses Passport JS authentication combined with MongoDB database to create and authenticate users. When you first arrive on the main page, clicking the "Sign Up" button on the navbar will take you to a page that allows you to create a new user through an HTTP POST request. If all goes successfully, you will create a new user login with those credentials and can then log out and log in at your pleasure.
#### User Sessions
If a user redirects to another page in the server, they do not have to change the page. Their session and cookie information is saved in the MongoDB database and keeps them logged in for the duration of their session.
### EJS Template
The EJS template used in rendering HTML allows the a user to see HTML content that is based on the current user. The navbar will show the username of the currently signed in user, the friends drop-down will show a list of all the current user's friends, the friend requests drop-down will show a list of the current user's pending friend requests, clicking on the currently signed in user will take the user to their match history page, and clicking on a friend's match history button will take the user to that friend's match history page.
### Flash Alerts
Errors or success messages are shown using the connect-flash npm module. They disappear on refresh and help the user know when something has went wrong and when it has went correctly.
### Responsiveness
The app is mostly responsive thanks to the help of a lot of bootstrap. The cards in the game scale down to the users viewing height, it can even be played on mobile. The rest of the website is also mobile friendly and can be enjoyed from any viewing height and width.
### Friends
Each user can add a friend to their friends list. First they start by adding a friend by searching their username up. If the friend is found and is not already their friend, they will send a friend request to that person. When the person accepts their friend request, they become each other's friends. This information is all held in a Mongolabs free online database which means that the information will remain stored.
### The Game (Basic Features)
The game is a card game that may seem kind of confusing to play at first. It is all documented in the "/howtoplay" page. It makes use of a lot of event listeners through jQuery. It uses click listeners on any playable cards, and hover listeners for tool tips where needed. There is also a dialogue box that asks the user if they are sure they want to leave the page when in the game as if they leave they automatically lose. The rules of the game are coded in such that a user cannot make any unallowed or game-breaking actions.

## Advanced Features - Real Time Updates
### Overview 
If there is one thing to take away from this app, it is the real time updates. An npm package that utilizes web sockets called Socket.io was used to make this work. Users get notifications in the bottom right corner for some real time updates and their HTML can change based on another user's actions. A few examples of how this is used are found below.
### Online Status
When a user is online, that user informs all other online users in their friends list that they are online. Every friend that receives this information immediately has their friend's list updated to show that that user is now online by having their name highlighted in green. There is also a number that shows how many friends a user has online at a time.

When a user is online, they also gets the information about which of their friends are currently online at that time, and reflect that information in their friends list.

Anytime a user goes offline, they inform all other friends that are currently online that they have went offline. Their name becomes black to all of their online friends and their friends' online friends count is updated.
### Adding/Removing Friends
When a user sends a friend request to another user, the server will check if that user is online. If they are, it will immediately notify them that they have received a friend request and update their friend request list. 

When the user decides to accept the friend request, if the user who sent it is still online, they will receive an immediate notification informing them that the user has accepted their friend request, and both users will have their friends lists updated accordingly.

Friends lists are also updated in real time when a user removes a friend.

### The Game (Real Time Updates)
A user can only invite a friend to a game of cards if they are online. When they do so, the other player receives a notification asking them if they'd like to accept. If they do, both users are redirected to the game page. The game page is safe in that no other users can access it after 5 seconds of the first two players connecting. If a user does manage to access it in that time frame, they are given a prompt that they cannot join the game and redirected back to the home page. Attempting to access the page after 5 seconds redirects the user to the home page.

When both users are in the game, a random player will start their turn and each player will be notified of who's turn it is. The player that has the turn can play according to the rules and the other player will see what they are doing in real time. When they end their turn, the other player gets a turn and the roles are reversed. Everything that changes is updated for both players in real time, allowing for smooth game play without latency. 

When a user wins, or another user disconnects, a new MongoDB match is created indicating the winner and loser. Each user's match history will be updated to show the time the game started, the length of the game, the users playing, whether the match resulted in a defeat or victory, and the final score.

## Other Notes
### Dependencies
The npm dependencies are found in the package.json, but they will be listed here to explain what they are used for:

 - body-parser: For parsing the JSON of a post request into a javascript object req.body
 - connect-flash: Flashes error and success messages to the user that are visible once
 - connect-mongodb-session: Stores session and cookie information for a user in MongoDB database
 - dateformat: For formatting javascript Date objects
 - dotenv: Required for local development. Allows environment variables to be set from a .env file in process.env
 - ejs: Template used for rendering HTML based on the user
 - express: The main app and routing functionality
 - express-session: Links the app with a user's session information
 - mongoose: Allows for interaction with a MongoDB database
 - passport: Authentication of user credentials
 - passport-local: Strategy for authenticating users
 - passport-local-mongoose: Attachment of authentication to users in the MongoDB database
 - socket.io: Websocket functionality for real time updates

Javascript dependencies include:

 - jQuery: For DOM manipulation
 - Bootstrap javascript files: For bootstrap functionality

Styling dependencies include: 

 - Bootstrap 4: Styling almost everything involved some bootstrap styles

Images:

 - All card images (1 - 12, "Pass", the back, and the deck) were made on my own using Microsoft Paint
 - The image in the "/howtoplay" page was made on my own using a screenshot and Microsoft Word
 - Background images were taken from http://unsplash.com