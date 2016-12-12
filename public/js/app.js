'use strict';
var pfadmin = angular.module('fbProto', ['ipCookie', 'ngResource', 'ngSanitize', 'ngAnimate', 'ui.router', 'ui.bootstrap','ngImgCrop','toastr','ngFileUpload']);
pfadmin.config(function($interpolateProvider) {
	$interpolateProvider.startSymbol('{$');
	$interpolateProvider.endSymbol('$}');
});
pfadmin.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
	$locationProvider.hashPrefix('!');
	$urlRouterProvider.otherwise('/');
	$stateProvider
		.state('login', {
			url: '/login',
			templateUrl: 'partials/login.html'
		})
		.state('logout', {
			url: '/logout',
			templateUrl: 'partials/logout.html'
		})
		.state('register', {
			url: '/register',
			templateUrl: 'partials/register.html'
		})
		.state('home', {
			url: '/home',
			templateUrl: 'partials/home.html'
		})

		// Profile
		.state('profile', {
			url: '/profile',
			templateUrl: 'partials/profile.html',
			controller:'profileCtrl'
		})
		
		;
});