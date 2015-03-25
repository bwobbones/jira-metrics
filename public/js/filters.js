'use strict';

/* Filters */

angular.module('myApp.filters', []).
  filter('interpolate', function (version) {
    return function (text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  })

.filter('unique', function() {

  return function (arr, field) {
    var o = {}, i, l = arr.length, r = [];
    for(i=0; i<l;i+=1) {
      o[arr[i][field]] = arr[i];
    }
    for(i in o) {
      r.push(o[i]);
    }
    return r;
  };
})

.filter('statusIn', ['_', function (_) {
    return function (jiras, statusNames) {
      var result = [];
      if(statusNames) {
        _.each(jiras, function(jira) {
          _.every(statusNames, function(status) {
            if(jira.fields.status.name === status) {
             result.push(jira);
             return false;
            }

            return true;
          });
        });
      }
      return result;
    };
  }]
)

.filter('buildStatus', ['_', function (_) {
    return function (builds, status) {
      var result = [];
      if(builds) {
        _.each(builds, function(build) {
          if(build.data.result === status) {
           result.push(build);
           return false;
          }

          return true;
        });
      }
      return result;
    };
  }]
)

.filter('taskStatusNot', ['_', function (_) {
    return function (tasks, status, status2) {
      var result = [];
      if(tasks) {
        _.each(tasks, function(task) {
          if(task.fields.status.name !== status) {
            if(!status2 || task.fields.status.name !== status2) {
              result.push(task);
              return false;
            }
          }

          return true;
        });
      }
      return result;
    };
  }]
);
