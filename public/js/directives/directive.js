'use strict';

// for confirm password
pfadmin.directive('nxEqual', function() {
	return {
		require: 'ngModel',
		link: function (scope, elem, attrs, model) {
			if (!attrs.nxEqual) {
				console.error('nxEqual expects a model as an argument!');
				return;
			}
			scope.$watch(attrs.nxEqual, function (value) {
				model.$setValidity('nxEqual', value === model.$viewValue);
			});
			model.$parsers.push(function (value) {
				var isValid = value === scope.$eval(attrs.nxEqual);
				model.$setValidity('nxEqual', isValid);
				return isValid ? value : undefined;
			});
		}
	};
});

//Get Image
pfadmin.directive('fileModel', ['$parse',
	function($parse) {
		var helper = {
			isSizeLimit: function(file) {
				return file.size < 5242880;
			},
			isimage: function(file) {
				var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
				return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
			}
		};
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				var model = $parse(attrs.fileModel);
				var modelSetter = model.assign;
				var models = [];
				element.bind('change', function() {
					scope.$apply(function() {
						var errors = {
							filesize: [],
							incorrectFile: []
						};
						if (helper["is" + attrs.fileType](element[0].files[0])) {
							if (helper.isSizeLimit(element[0].files[0])) {
								models.push(element[0].files[0]);
							} else {
								errors.filesize.push(element[0].files[0].name);
							}
						} else {
							errors.incorrectFile.push(element[0].files[0].name);
						}
						element[0].value = "";
						model(scope, {
							$files: models,
							$event: "true",
							$errors: errors
						});
					});
				});
			}
		};
	}
]);

// Debounce for input field
pfadmin.service('debounce', ['$timeout', function ($timeout) {
	return function (func, wait, immediate) {
		var timeout, args, context, result;
		function debounce() {
			/* jshint validthis:true */
			context = this;
			args = arguments;
			var later = function () {
				timeout = null;
				if (!immediate) {
					result = func.apply(context, args);
				}
			};
			var callNow = immediate && !timeout;
			if (timeout) {
				$timeout.cancel(timeout);
			}
			timeout = $timeout(later, wait);
			if (callNow) {
				result = func.apply(context, args);
			}
			return result;
		}
		debounce.cancel = function () {
			$timeout.cancel(timeout);
			timeout = null;
		};
		return debounce;
	};
}])
.directive('debounce', ['debounce', '$parse', function (debounce, $parse) {
	return {
		require: 'ngModel',
		priority: 999,
		link: function ($scope, $element, $attrs, ngModelController) {
			var debounceDuration = $parse($attrs.debounce)($scope);
			var immediate = !!$parse($attrs.immediate)($scope);
			var debouncedValue, pass;
			var prevRender = ngModelController.$render.bind(ngModelController);
			var commitSoon = debounce(function (viewValue) {
				pass = true;
				ngModelController.$setViewValue(viewValue);
				pass = false;
			}, parseInt(debounceDuration, 10), immediate);
			ngModelController.$render = function () {
				prevRender();
				commitSoon.cancel();
				//we must be first parser for this to work properly,
				//so we have priority 999 so that we unshift into parsers last
				debouncedValue = this.$viewValue;
			};
			ngModelController.$parsers.unshift(function (value) {
				if (pass) {
					debouncedValue = value;
					return value;
				} else {
					commitSoon(ngModelController.$viewValue);
					return debouncedValue;
				}
			});
		}
	};
}]);