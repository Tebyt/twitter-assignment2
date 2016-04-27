var express = require('express')
    , app = express()
    , bodyParser = require('body-parser');

app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function () {
    console.log('Listening on port ' + app.get('port'))
});

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
app.use(bodyParser.json());

app.post('/api/tweets', extractMessage)