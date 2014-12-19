'use strict';

/* Services */
var appServices = angular.module('myApp.services', []);

appServices.factory('_', function() {
  return window._;
});