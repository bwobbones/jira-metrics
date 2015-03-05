/**
 * Master Controller
 */

angular.module('myApp')
    .controller('MasterCtrl', ['$scope', '$cookieStore', '$rootScope', '$location', '$state', '$stateParams', 'config', '$timeout', MasterCtrl]);

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function MasterCtrl($scope, $cookieStore, $rootScope, $location, $state, $stateParams, config, $timeout) {

    $scope.slideshowPlaying = null;

    $scope.pauseSlideshow = function() {
        if($scope.slideshowPlaying) {
            $timeout.cancel($scope.slideshowPlaying);
        }

        $scope.slideshowPlaying = null;
    };

    $scope.startSlideshow = function() {
        var pages = ['/metrics', '/agile', '/activity'];
        var slideTime = 5000;
        var gotoNextPage = function() {
            if(!$scope.slideshowPlaying) {
                console.log('not playing')
                return;
            }
            console.log('playing')
            var currentPage = $location.path();
            var currentPageIndex = pages.indexOf($location.path());
            if(currentPageIndex > -1) {
                var nextPageIndex = (currentPageIndex + 1) % pages.length;
                var nextPage = pages[nextPageIndex];
                console.log(nextPage)
                $location.path(nextPage);
                $scope.slideshowPlaying = $timeout(gotoNextPage, slideTime);
            }
        };

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