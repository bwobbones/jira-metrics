jira-metrics
============

Pull metrics from a jira repository.

To install you'll firstly need to install [node.js](http://www.nodejs.org), then:

`git clone https://github.com/bwobbones/jira-metrics.git`

`npm install`

`bower install`

`node app.js`

Add a `.env` file to the root of the project that contains:

```
JIRA_USERNAME=<username>	
JIRA_PASSWORD=<password>
```

In /public/js/app.js adjust jiraHostName to be your jira repository url.

![Metrics Image][1]

 [1]: https://raw.githubusercontent.com/lotsabackscatter/jira-metrics/master/screenshots/metrics.jpg "Metrics Image"
