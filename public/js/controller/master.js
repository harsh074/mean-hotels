'use strict';
pfadmin.controller('MasterCtrl', function($scope, $rootScope, $state, ipCookie, utilityService) {
	utilityService.initialize('/api', false, $scope, $rootScope);
	$scope.loggedIn = false;

	$state.go('home');
	if(ipCookie('token')){
		$state.go('profile');
	}

});

//crop image Factory
pfadmin.factory('imageCropService', function($modal, $q) {
	var img = {
		'getCroppedImage': function(photoFile) {
			var deferred = $q.defer();
			var imageToUpdate = '';
			var reader = new FileReader();
			reader.onload = function(e) {
				imageToUpdate = e.target.result;
				var modalInstance = $modal.open({
					templateUrl: '/partials/imagecrop.html',
					controller: 'imageCropCtrl',
					resolve: {
						image: function() {
							return imageToUpdate;
						}
					},
					backdrop: 'static',
					keyboard: false
				});
				modalInstance.result.then(function(croppedImage) {
					deferred.resolve(croppedImage);
				});
			};
			reader.readAsDataURL(photoFile);
			return deferred.promise;
		},
		'convertintoimage': function(dataURI) {
			var byteString;
			if (dataURI.split(',')[0].indexOf('base64') >= 0) {
				byteString = atob(dataURI.split(',')[1]);
			} else {
				byteString = unescape(dataURI.split(',')[1]);
			}
			var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
			var ia = new Uint8Array(byteString.length);
			for (var i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i);
			}
			return new Blob([ia], {
				type: "image"
			});
		}
	}
	return img;
});
