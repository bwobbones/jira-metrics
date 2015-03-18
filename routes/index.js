
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index');
};

exports.partials = function (req, res) {
  var component = req.params.component;
  var name = req.params.name;

  console.log('routing to ' +component + '/views/' + name);

  res.render(component + '/views/' + name);
};