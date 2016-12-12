'use strict';
cfadmin.directive('fileModel', ['$parse',
	function($parse) {
		var helper = {
			isSizeLimit: function(file) {
				return file.size < 5242880;
			},
			isimage: function(file) {
				var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
				return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
			},
		}
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