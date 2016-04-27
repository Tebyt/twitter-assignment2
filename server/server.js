var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

var overrideContentType = function (req, res, next) {
    if (req.headers['x-amz-sns-message-type']) {
        req.headers['content-type'] = 'application/json;charset=UTF-8';
    }
    next();
};
var extractMessage = function (req, res, next) {
    if (req.headers['x-amz-sns-message-type']) {
        req.body = req.body.Message;
    }
    console.log(req.body);
    next();
}
app.post('/api/tweets', overrideContentType);
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.post('/api/tweets', extractMessage)


// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
