appServices.factory('Jenkins', function ($resource, config) {
    return {
        build: function(build) {
          return $resource('api/issueDetails', { issueUrl: config.jenkinsHostName + '/jenkins/job/' + build + '/lastBuild/api/json'});
        },
    };
});