appServices.factory('JIRA', function ($resource, config) {
    return {
        throughputData: $resource('api/throughputData', {
                            jiraHostName: config.jiraHostName,
                            'projects[]': config.projects,
                            'completionTypes[]': config.completionTypes,
                            issueTypes: config.issueTypes
                          },
                          {
                            get : {
                                    method : 'GET',
                                    cache: true
                                }
                         }),

        currentSprint: $resource('api/currentSprint', {
                              jiraHostName: config.jiraHostName,
                              'projects[]': config.projects,
                              'completionTypes[]': config.completionTypes,
                              issueTypes: config.issueTypes
                          },
                          {
                            get : {
                                    method : 'GET',
                                    cache: true
                                }
                         })
    };
});