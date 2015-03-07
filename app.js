
/**
 * Module dependencies
 */
var dotenv = require('dotenv');
dotenv.load();

var express = require('express'),
  routes = require('./routes'),
  api = require('./routes/api'),
  http = require('http'),
  path = require('path');

var app = module.exports = express();


/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3200);
app.set('views', __dirname + '/components');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'components')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/bower_components'));
app.use('/test', express.static(__dirname + '/test'));
app.use(app.router);

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

// production only
if (app.get('env') === 'production') {
  // TODO
}

/**
 * Routes
 */

 var callback = function() {
   // noop
 };

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:component/:name', routes.partials);

app.get('/api/throughputData', function(req, res) {
  api.throughputData(req, res);
});

app.get('/api/currentSprint', function(req, res) {
  api.currentSprint(req, res);
});

app.get('/api/xml', function(req, res) {
  api.xml(req, res);
});

app.get('/api/search', function(req, res) {
  api.search(req, res);
});

app.get('/api/allIssuesPerWeek/:weekNumber', function(req, res) {
  api.allIssuesPerWeek(req, res);
});

app.get('/api/issueDetails/:issueUrl', function(req, res) {
  api.issueDetail(req, res);
});

//redirect all others to the index (HTML5 history)
app.get('*', routes.index);


/**
 * Start Server
 */
http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

