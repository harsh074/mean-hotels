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
var hotelRouter = express.Router({mergeParams: true});
var customerRouter = express.Router({mergeParams: true});
module.exports = function(app) {
	app.use('/api', apiRoutes);
	apiRoutes.use('/blog', blogRouter);
	apiRoutes.use('/hotel', hotelRouter);
	apiRoutes.use('/customer', customerRouter);

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

	// route to create collection
	apiRoutes.get('/createCollection',function(req,res){
		var db = req.db;
		var userCollection = db.create('auth_users');
		var counterCollection =  db.create('authuser_counter');
		var customerCollection =  db.create('customer');
		var hotelDealsCollection =  db.create('hotelDeals');
		counterCollection.insert({"counterid": "counterId","sequence_value" : 1});
		res.json({ message: 'Done' });
	});

	// route to reset the DataBase
	apiRoutes.get('/clearCollection',function(req,res){
		var db = req.db;
		var userCollection = db.get('auth_users');
		var counterCollection = db.get('authuser_counter');
		var customerCollection = db.get('customer');
		var hotelDealsCollection = db.get('hotelDeals');
		var blogCollection = db.get('blogs');
		userCollection.remove({});
		customerCollection.remove({});
		hotelDealsCollection.remove({});

		counterCollection.remove({});
		counterCollection.insert({"counterid": "counterId","sequence_value" : 1});
		// counterCollection.findAndModify({query:{"counterid": "counterId"},update:{$set:{"sequence_value" : 1}}});
		blogCollection.remove({});
		res.json({ message: 'Done' });
	});


	// route to register a user (POST http://localhost:5000/api/register)
	apiRoutes.post('/register',function(req,res){
		console.log("register");
		var db = req.db;
		var usersCollection = db.get('auth_users');
		var counterCollection = db.get('authuser_counter');
		counterCollection.findAndModify({query:{counterid: "counterId"},update: {$inc:{sequence_value:1}},new:true}, function(err,data){

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
			usersCollection.insert(newUser, function(err, result){
				if (err) throw err;

				var token = jwt.sign(result, app.get('superSecret'), {
					expiresInSeconds: 3600 // expires in 24 hours
				});
				res.cookie('token', token, { path: '/', httpOnly: true });
				res.json({
					first_name:result.first_name,
					last_name:result.last_name,
					email:result.email,
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
			var resData = result[0];
			res.json({
				"email":resData.email,
				"first_name":resData.first_name,
				"last_name":resData.last_name,
				"current_city":resData.current_city,
				"age":resData.age,
				"mobile_number":resData.mobile_number,
				"profile_image":resData.profile_image
			});
		})
	});
	apiRoutes.put('/profile',authenticate, function(req, res) {
		var db = req.db;
		var userCollection = db.get('auth_users');
		console.log(req.decoded);
		userCollection.update({
			ownerid:req.decoded.ownerid
		},{
      $set: {"current_city":req.body.current_city,"age":req.body.age,"mobile_number":req.body.mobile_number}
    },{ 
      multi:true
    },function(err, result){
    	if(err){
				res.json(err).status(400);
			};
			res.json({message:'done'}).status(200);
		});
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
				if(err){
					res.json(err).status(400);
				};
				mv(tmp_path, target_path,{mkdirp: true}, function(err) {
					if(err){
						res.json(err).status(400);
					};
					res.json({ resp: result }).status(200);
					fs.unlink(tmp_path, function(err1) {
          	if(err1){
							console.log(err);
						}
      		});
				});
			});
		})
		.get(authenticate,function(req,res) {
			var db = req.db;
			var blogCollection = db.get('blogs');
			blogCollection.find({},function(err,result){
				if(err){
					res.json(err).status(400);
				};
				res.json({ resp: result }).status(200);
			});
		});


	hotelRouter.route('/list')
		.post(function(req,res){
			var db = req.db;
			var hotelDealsCollection = db.get('hotelDeals');
			hotelDealsCollection.insert(req.body,function(err,result){
				if(err){
					res.json(err).status(400);
				};
				res.json(result).status(200);
			});
		})
		.get(function(req,res){
			var db = req.db;
			var hotelDealsCollection = db.get('hotelDeals');
			hotelDealsCollection.find({},function(err,result){
				if(err){
					res.json(err).status(400);
				};
				res.json(result).status(200);
			});
		});

	hotelRouter.route('/list/:nextIndex')
		.get(function(req,res){
			var nextIndex = 5;
			var skipIndex = req.params.nextIndex-5;
			// console.log(nextIndex);
			var db = req.db;
			var hotelDealsCollection = db.get('hotelDeals');
			hotelDealsCollection.find({},{limit:nextIndex,skip:skipIndex},function(err,result){
				if(err){
					res.json(err).status(400);
				};
				res.json(result).status(200);
			});
		});

	hotelRouter.route('/stats')
		.get(function(req,res){
			var db = req.db;
			var hotelDealsCollection = db.get('hotelDeals');
			hotelDealsCollection.aggregate([{$group : {
				_id:null,
				avg_rating : {$avg : "$rating"},
				max_final_price:{$max: { $multiply: [ "$actual_price", {$subtract:[1, {$divide:["$discount",100]} ] } ] }},
				min_final_price:{$min: { $multiply: [ "$actual_price", {$subtract:[1, {$divide:["$discount",100]} ] } ] }}
			}}],function(err,result){
				if(err){
					res.json(err).status(400);
				};

				// need to update this call in future. Not able to do it right now. but have to club it with upper query.
				hotelDealsCollection.aggregate([
					{$group: {_id: "$location.city", zcount: {$sum: 1}}}
				],function(err1,result1){
					if(err1){
						res.json(err1).status(400);
					};
					result[0].area_distribution = {};
					for(var i=0; i<result1.length;i++){
						result[0].area_distribution[result1[i]._id] = result1[i].zcount;
					}
					res.json(result).status(200);
				});
			});
		});

	customerRouter.route('/all')
		.post(function(req,res){
			var db = req.db;
			var customerCollection = db.get('customer');
			customerCollection.insert(req.body,function(err,result){
				if(err){
					res.json(err).status(400);
				};
				res.json(result).status(200);
			});
		})
		.get(function(req,res){
			var db = req.db;
			var customerCollection = db.get('customer');
			customerCollection.find({},function(err,result){
				if(err){
					res.json(err).status(400);
				};
				res.json(result).status(200);
			});
		});

	customerRouter.route('/query')
		.get(function(req,res){
			var db = req.db;
			var customerCollection = db.get('customer');
			var key = req.query.key;
			var limit = req.query.limit;
			var searchQuery = {$text:{$search:"An"}};
			customerCollection.index("fullName");
			console.log(customerCollection.indexes());
			res.json("result").status(200);
			// customerCollection.find(searchQuery,function(err,result){
			// 	if(err){
			// 		res.json(err).status(400);
			// 	};
			// 	res.json(result).status(200);
			// });
			

		});

	// frontend routes =========================================================
	// route to handle all angular requests
	app.get('/', function(req, res) {
		res.render('./public/index'); // load our public/index.html file
	});
};