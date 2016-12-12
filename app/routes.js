// grab the nerd model we just created

// var model = require('./models/models');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var express	= require('express');
var apiRoutes = express.Router(),
		jwt = require('jsonwebtoken'),
		fs = require('fs'),
		multipart = require('connect-multiparty'),
		multipartMiddleware = multipart();

var mv = require('mv');

var blogRouter = express.Router({mergeParams: true});
module.exports = function(app) {
	app.use('/api', apiRoutes);
	apiRoutes.use('/blog', blogRouter);

	function hashPassword(password) {
		return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
	}

	function comparePassword(password, salts) {
		return bcrypt.compareSync(password, salts);	
	}
	
	function randomString(length) {
		return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
	}

	function authenticate(req, res, next) {
		// check header or url parameters or post parameters or cookies for token
		var token = req.body.token || req.query.token || req.headers['token'] || req.cookies['token'];

		if (token) {
			// verifies secret and checks exp
			jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
				if (err) {
					return res.status(403).send({ success: false, message: 'Failed to authenticate token.' });    
				} else {
					// if everything is good, save to request for use in other routes
					// console.log("decoded",decoded)
					req.decoded = decoded;    
					next();
				}
			});

		} else {

			// if there is no token
			// return an error
			return res.status(403).send({ 
					success: false, 
					message: 'No token provided.' 
			});
			
		}
	};

	// route to show a random message (GET http://localhost:8080/api/)
	apiRoutes.get('/', function(req, res) {
		res.json({ message: 'Welcome to the coolest API on earth!' });
	});

	// route to reset the DataBase
	apiRoutes.get('/clearcollection',function(req,res){
		var db = req.db;
		var userCollection = db.get('auth_users');
		var counterCollection =  db.get('authuser_counter');
		var blogCollection = db.get('blogs');
		userCollection.remove({});
		counterCollection.findAndModify({query:{"counterid": "counterId"},update:{$set:{"sequence_value" : 1}}});
		blogCollection.remove({});
		res.json({ message: 'Done' });
	});

	// route to register a user (POST http://localhost:5000/api/register)
	apiRoutes.post('/register',function(req,res){
		console.log("register");
		var db = req.db;
		var collection = db.get('auth_users');
		var users = db.get('authuser_counter');
		users.findAndModify({query:{counterid: "counterId"},update: {$inc:{sequence_value:1}},new:true}, function(err,data){

			var newUser = {
				first_name: 	req.body.first_name,
				last_name: 		req.body.last_name,
				email: 				req.body.email,
				// password: 		req.body.password,
				salts: 				hashPassword(req.body.password),
				ownerid: 			data.sequence_value,
				date_joined : new Date()
			};
			// console.log(newUser);
			collection.insert(newUser, function(err, result){
				if (err) throw err;

				var token = jwt.sign(result, app.get('superSecret'), {
					expiresInSeconds: 3600 // expires in 24 hours
				});
				res.cookie('token', token, { path: '/', httpOnly: true });
				res.json({
					first_name:result.first_name,
					last_name:result.last_name,
					token: token
				});
			});
			// console.log(data);
		});
	});

	// route to authenticate a user (POST http://localhost:5000/api/login)
	apiRoutes.post('/login', function(req, res) {
		var db = req.db;
		var collection = db.get('auth_users');
		// find the user
		collection.findOne({email: req.body.email}, function(err, user) {
			if (err) throw err;

			if (!user) {
				res.status(400).json({ success: false, message: 'Authentication failed. User not found.' });
			} else if (user) {

				// check if password matches
				// console.log(user)
				// console.log(comparePassword(req.body.password,user.salts));
				if (!comparePassword(req.body.password,user.salts)) {
					res.status(400).json({ success: false, message: 'Authentication failed. Wrong password.' });
				} else {

					// if user is found and password is right
					// create a token
					var token = jwt.sign(user, app.get('superSecret'), {
						expiresInSeconds: 3600 // expires in 24 hours
					});

					// return the information including token as JSON
					res.cookie('token', token, { path: '/', httpOnly: true });
					res.status(200).json({
						success: true,
						message: 'Enjoy your token!',
						token: token
					});
				}   
			}
		});
	});
	
	// route to logout a user (GET http://localhost:5000/api/logout)

	// route to return all users (GET http://localhost:5000/api/users)
	apiRoutes.get('/profile',authenticate, function(req, res) {
		var db = req.db;
		var userCollection = db.get('auth_users');
		userCollection.find({ownerid:req.decoded.ownerid},function(err, result){
			res.json(
				// {first_name:req.decoded.first_name,
				// 	last_name:req.decoded.last_name,
				// 	email:req.decoded.email
				// }
				result[0]
			);
		})
	});
	apiRoutes.put('/profile',authenticate, function(req, res) {
		var db = req.db;
		var userCollection = db.get('auth_users');
		userCollection.find({ownerid:req.decoded.ownerid},function(err, result){
			res.json(
				// {first_name:req.decoded.first_name,
				// 	last_name:req.decoded.last_name,
				// 	email:req.decoded.email
				// }
				result[0]
			);
		})
	});

	apiRoutes.post('/profile-image',authenticate,multipartMiddleware,function(req,res){
		var db = req.db;
		var userCollection = db.get('auth_users');
		var tmp_path = req.files.image.path;
    var target_path = './uploads/profile/image_'+Date.now()+'.jpg';
    mv(tmp_path, target_path,{mkdirp: true}, function(err) {
      if (err) throw err;
      userCollection.findAndModify({
      	query:{ownerid:req.decoded.ownerid},
      	update:{$set:{profile_image:target_path}},new:true
      	},function(err,result){
      		if(err) throw err;
      		res.send({
      			profile_image:target_path
      		});
      });
      fs.unlink(tmp_path, function() {
          if (err) throw err;
      });
    });
	})

	blogRouter.route('/')
		.post(authenticate,multipartMiddleware,function(req,res){
			console.log(req.files,req.body)
			var db = req.db;
			var blogCollection = db.get('blogs');
			var tmp_path = req.files.image.path;
    	var target_path = './uploads/blog/'+req.decoded.ownerid+'/image_'+Date.now()+'.jpg';
			var blog = {
				ownerid:req.decoded.ownerid,
				title:req.body.title,
				content:req.body.content,
				blog_image:target_path,
				data_created: new Date()
			};
			blogCollection.insert(blog,function(err,result){
				if(err) throw err;
				mv(tmp_path, target_path,{mkdirp: true}, function(err) {
					if(err) throw err;
					res.status(200).json({ resp: result });
					fs.unlink(tmp_path, function() {
          	if (err) throw err;
      		});
				});
			});
		})
		.get(authenticate,function(req,res) {
			var db = req.db;
			var blogCollection = db.get('blogs');
			blogCollection.find({},function(err,result){
				if(err) throw err;
				res.json({ resp: result });
			});
		});
	// frontend routes =========================================================
	// route to handle all angular requests
	app.get('/', function(req, res) {
		res.render('./public/index'); // load our public/index.html file
	});
};