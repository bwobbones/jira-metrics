metricsDirectives.directive('throughput', function($rootScope) {

  return {
    restrict: 'E',

    link: function(scope, element, attrs) {

      var width = 80;
      var height = 50;

      scope.$watch('stats', function(newValue, oldValue) {

        if (newValue == oldValue) {
          return;
        }        

        var svg = d3.select('#' + element[0].id)
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .append("g")          

        var x = d3.scale.linear()
          .range([0, width]);

        var y = d3.scale.linear()
          .range([0, height]);

        var line = d3.svg.line()
          .x(function(d) { return x(d.weekNumber); })
          .y(function(d) { return height - y(d.throughput); });

        var thisWeek = element[0].id.replace(/gap/g, '/');
        thisWeek = thisWeek.replace(/throughput/g, '');

        var data = [];
        _.each(scope.stats, function(stat) {
          if (thisWeek === stat.week) {

            for (var i = 0; i < stat.throughput.length; i++) {
              var throughputValue = stat.throughput[i];
              data.push( {
                weekNumber: i,
                throughput: throughputValue
              });
            };

            x.domain(d3.extent(data, function(d) { return d.weekNumber; }));
            y.domain(d3.extent(data, function(d) { return d.throughput; }));

            svg.append("path")
              .datum(data)
              .attr("class", "line")
              .attr("d", line)
              .append("svg:title")
              .text(stat.throughput);              
          }
        });

      }, true);

    }
 
  }

});