'use strict';
pfadmin.controller('profileCtrl', function($scope, $rootScope, $state, imageCropService, $modal, utilityService) {
	$scope.editing = false;
	$scope.loading = true;

	//Update Profile Pcture
	$scope.image = function($files, $errors) {
		var imageError = '';
		//check if there is any error
		if (angular.isDefined($errors) && ($errors.filesize.length || $errors.incorrectFile.length)) {
			if ($errors.filesize.length) {
				imageError += 'File size exceeds 5 mb for ' + $errors.filesize.join(', ');
			}
			if ($errors.incorrectFile.length) {
				imageError += '\n Incorrect file type for ' + $errors.incorrectFile.join(', ');
			}
			alert(imageError);
		} else {
			//call image crop service to get cropped image as form data
			//send the last image in $files
			imageCropService.getCroppedImage($files[$files.length - 1])
				.then(function(croppedImage) {
					var content = imageCropService.convertintoimage(croppedImage);
					var fd = new FormData();
					fd.append('image', content);
					utilityService.updateprofilepic(fd)
						.then(function(data) {
							$scope.profileimg = true;
							$scope.details.profile_image = data.profile_image;
							console.log("success in uploading profile image", data);
						}, function(data) {
							console.log("error in uploading profile image", data)
						});
				});
		}
	};

	// Get Profile
	getprofile();
	function getprofile() {
		utilityService.profile()
		.then(function(data) {
				$scope.loading = false;
				$scope.details = data;
				if ($scope.details.profile_image == "") {
					$scope.profileimg = false;
				} else {
					$scope.profileimg = true;
				}
				//$scope.profileData = angular.copy($scope.details);
		}, function(data) {
			$scope.errors = data.user;
			if (data.detail == "Invalid token") {
				utilityService.logout();
				$scope.setAuth(false);
			}
		});
	}

	// Updating the profile
	$scope.editmode = function() {
		$scope.editing = true;
		$scope.profileData = angular.copy($scope.details);
	};

	$scope.reset = function() {
		$scope.profileData = angular.copy($scope.details);
		$scope.editing = false;
		window.scrollTo(0, 0);
	};
	
	$scope.updateProfile = function(formData) {
		if (formData.$valid) {
			for(var key in $scope.profileData){
				if($scope.profileData[key] == "" || $scope.profileData[key] === null || $scope.profileData[key] == 'none'){
					delete $scope.profileData[key];
				}
			}
			utilityService.updateprofile($scope.profileData)
				.then(function(data) {
					console.log(data);
					$scope.editing = false;
					getprofile();
					$state.reload();
				}, function(data) {
					$scope.errors = [];
					for (var key in data) {
						console.log(key);
						if (key != "status") {
							console.log(data[key][0]);
							$scope.errors.push(data[key][0]);
						}
					}
					console.log(data);
					if (data.detail == "Invalid token") {
						utilityService.logout();
						$scope.setAuth(false);
					}
				});
		}
	}
});

pfadmin.controller('imageCropCtrl', function($scope, image, $modalInstance) {
	$scope.originalImage = image;
	$scope.croppedImage = '';
	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
	$scope.uploadPic = function() {
		$modalInstance.close($scope.croppedImage);
	};
});