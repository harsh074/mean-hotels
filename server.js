// server.js

// modules =================================================
var express				     = require('express'),
	app					         = express(),
	bodyParser			     = require('body-parser'),
	methodOverride  	   = require('method-override'),
	cookieParser 		     = require('cookie-parser'),
	session 			       = require('express-session'),
	morgan      		     = require('morgan'),
	bcrypt 				       = require('bcrypt-nodejs'),
	passport 			       = require('passport'),
	localStrategy 		   = require('passport-local' ).Strategy,
	assert               = require('assert'),
	ObjectID 						 = require('mongodb').ObjectID,
	monk                 = require('monk');

// configuration ===========================================

// config files
var dburl = require('./config/db');

// set our port
var port = process.env.PORT || 5000; 

// connect to our mongoDB database 
var db = monk(dburl.url);
app.use(function(req,res,next){
	req.db = db;
	next();
});
app.set('superSecret', dburl.secret);

// get all data/stuff of the body (POST) parameters
// parse application/json 
app.use(bodyParser.json()); 

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override'));

// Use the cookies for session or other information.
app.use(cookieParser());

// use morgan to log requests to the console
app.use(morgan('dev'));

// set the static files location /public/img will be /img for users
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/'));
// app.use(express.limit('5mb'));

// routes ==================================================
// require('./app/routes')(app); // configure our routes
require('./app/routes')(app);

// start app ===============================================
// startup our app at http://localhost:8080
app.listen(port, function () {
	console.log('Magic happens on port %d in %s mode', port, app.get('env'));
});

// expose app           
exports = module.exports = app;   