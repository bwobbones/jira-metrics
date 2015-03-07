var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'JIRA Metrics Server',
  description: 'Server for JIRA Metrics',
  script: require('path').join(__dirname,'app.js')
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  console.log('Install complete.');
  svc.start();
  console.log('Server started.');
});

svc.install();