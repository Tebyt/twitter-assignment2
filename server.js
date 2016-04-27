// var express = require('express');
// var http = require('http');
// var cookieParser = require('cookie-parser');
// var bodyParser = require('body-parser');
// var xmlparser = require('express-xml-bodyparser');
// // var AWS = require('aws-sdk');
// var sns = require('express-aws-sns');

// // AWS credentials
// process.env.AWS_ACCESS_KEY_ID = "AKIAJ7V2P5ESSPCRTBSQ";
// process.env.AWS_SECRET_ACCESS_KEY = "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";

// var app = express();
// var server = http.Server(app);
// app.set('port', process.env.PORT || 3000);
// server.listen(app.get('port'), function () {
//     console.log('Listening on port ' + app.get('port'))
// });

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: false}));
// app.use(cookieParser());
// app.use(xmlparser());

// app.post('/tweet', function (req, res) {
//     // var msgType = req.get('x-amz-sns-message-type');
//     // var msgData = req.body;
//     // console.log(req.body);
//     // console.log("header");
//     // console.log(req.headers);
//     // // console.log(msgType, msgData);
//     // if( msgType === 'SubscriptionConfirmation') {
//     //     // confirm the subscription.
//     //     sns.confirmSubscription({
//     //         Token: msgData.Token,
//     //         TopicArn: msgData.TopicArn
//     //     });
//     // }
//     // console.log(req.snsMessage);
//     res.send("success");
// })

// // module.exports = app;


var express = require('express')
  , app = express()
  , SNSClient = require('aws-snsclient')
  , bodyParser = require('body-parser');
 
app.use(bodyParser.json());
var client = SNSClient(function(err, message) {
    if (err) console.log(err);
    else console.log(message);
});
 
// app.post('/api/tweets', client);
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function () {
    console.log('Listening on port ' + app.get('port'))
});


app.post('/api/tweets', function(req, res, next) {
    if (req.headers['x-amz-sns-message-type']) {
        req.headers['content-type'] = 'application/json;charset=UTF-8';
    }
    next();
})

app.post('/api/tweets', function(req, res) {
    console.log(req.body);
})