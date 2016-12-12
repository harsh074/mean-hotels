'use strict';

pfadmin.controller('RegisterCtrl', function ($scope, $state, $stateParams, utilityService, $rootScope, ipCookie) {
	if($rootScope.token){
		console.log("logged in")
		$state.go('profile');
	}

	$scope.model = {'first_name':'','last_name':'','email':'','password':''};
	$scope.complete = false;
	
	// Registration
	$scope.register = function(formData){
		$scope.errors = [];
		if(formData.$valid){
			utilityService.register($scope.model, $rootScope)
			.then(function(data){
				$scope.setAuth(true);
				$state.go('profile');

			},function(data){
				// error case
				//$scope.errors = [];
				//for(var key in data){
				//	if(key != "status"){
				//		console.log(data[key][0]);
				//		$scope.errors.push(data[key][0]);
				//	}
				//}
				$scope.errors = data.user.email;
				//console.log($scope.errors);
			});
		}
	}

});