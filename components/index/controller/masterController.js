/**
 * Master Controller
 */

angular.module('RDash')
    .controller('MasterCtrl', ['$scope', '$cookieStore', '$rootScope', '$location', '$state', '$stateParams', 'config', MasterCtrl]);

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function MasterCtrl($scope, $cookieStore, $rootScope, $location, $state, $stateParams, config) {

    $scope.config = config;
    $scope.state = $state;

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