'use strict';
pfadmin.controller('LoginCtrl', function ($scope, $rootScope, $state , utilityService) {
	if($rootScope.token){
		$state.go('profile');
	}
	else {
		$scope.model = {'email': '', 'password': '', 'staySign': false};
		$scope.complete = false;
		$scope.login = function (formData) {
			$scope.submitted = true;
			if (formData.password.$error.minlength) {
				$scope.minlength = true;
				$scope.model.password = "";
			}
			if (formData.email.$error.pattern) {
				$scope.pattern = true;
			}
			if (formData.$valid) {
				utilityService.login($scope.model, $rootScope)
					.then(function (data) {
						// success case
						$scope.complete = true;
						$scope.setAuth(true);
						$state.go('profile');
					}, function (data) {
						// error case
						$scope.error = data.message;
					});
			}
		}
	}
});