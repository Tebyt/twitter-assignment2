var app = require('express')();
var http = require('http');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var server = http.Server(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var api_tweets = require('./routes/api_tweets')
app.use('/api/tweets', api_tweets)

app.set('port', process.env.PORT || 3000);
server.listen(app.get('port'), function () {
    console.log('Listening on port ' + app.get('port'))
});

// Socket.io
// var io = require('socket.io')(server);
// io.on('connection', function (socket) {
//     console.log("connected");
// });
