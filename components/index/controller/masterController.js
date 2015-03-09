/**
 * Master Controller
 */

angular.module('myApp')
    .controller('MasterCtrl', ['$scope', '$cookieStore', '$rootScope', '$location', '$state', 'config', '$timeout', 'routes', '_', MasterCtrl]);

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function MasterCtrl($scope, $cookieStore, $rootScope, $location, $state, config, $timeout, routes, _) {
    $scope.slideTimeInSecs = config.slideTimeInSecs;
    $scope.routes = routes;
    $scope.startTimer = function() {
      $scope.started = true;
      document.getElementsByTagName('timer')[0].start();
    }

    $scope.stopTimer = function() {
      $scope.started = false;
      document.getElementsByTagName('timer')[0].clear();
    };

    $scope.restartTimer = function() {
        $scope.stopTimer();
        $scope.startTimer();
    }

    $scope.slideshowPlaying = null;

    $scope.pauseSlideshow = function() {
        if($scope.slideshowPlaying) {
            $timeout.cancel($scope.slideshowPlaying);
        }

        $scope.stopTimer();
        $scope.slideshowPlaying = null;
    };

    $scope.startSlideshow = function() {
        var pages = [];
        _.each(routes, function(route) {
            pages.push('/' + route.url);
        });

        var slideTime = $scope.slideTimeInSecs * 1000;
        var gotoNextPage = function() {
            $scope.restartTimer();
            if(!$scope.slideshowPlaying) {
                return;
            }
            var currentPage = $location.path();
            var currentPageIndex = pages.indexOf($location.path());
            if(currentPageIndex > -1) {
                var nextPageIndex = (currentPageIndex + 1) % pages.length;
                var nextPage = pages[nextPageIndex];
                $location.path(nextPage);
                $scope.slideshowPlaying = $timeout(gotoNextPage, slideTime);
            }
        };

        $scope.startTimer();
        $scope.slideshowPlaying = $timeout(gotoNextPage, slideTime);
    };

    $scope.config = config;
    $scope.state = $state;

    $scope.isActive = function (viewLocation) {
        var active = (viewLocation === $location.path());
        return active;
    };

    $scope.toggleBarChart = function() {
        $rootScope.$broadcast('toggleBarChart', $scope.isBarchart);
    };

    /**
     * Sidebar Toggle & Cookie Control
     */
    var mobileView = 992;

    $scope.capitalizeFirstLetter = function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    $scope.getWidth = function() {
        return window.innerWidth;
    };

    $scope.$watch($scope.getWidth, function(newValue, oldValue) {
        if (newValue >= mobileView) {
            if (angular.isDefined($cookieStore.get('toggle'))) {
                $scope.toggle = ! $cookieStore.get('toggle') ? false : true;
            } else {
                $scope.toggle = true;
            }
        } else {
            $scope.toggle = false;
        }

    });

    $scope.toggleSidebar = function() {
        $scope.toggle = !$scope.toggle;
        $cookieStore.put('toggle', $scope.toggle);
    };

    window.onresize = function() {
        $scope.$apply();
    };
}