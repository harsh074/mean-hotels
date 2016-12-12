'use strict';

pfadmin.controller('LogoutCtrl', function ($scope, $rootScope, utilityService) {
  utilityService.logout($rootScope);
  $scope.setAuth(false);
});
