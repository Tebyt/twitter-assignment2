var express = require('express');
var app = express();
var http = require('http');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
// var compression = require('compression');
var io = require('socket.io');

var server = http.Server(app);

io = io.listen(server);
io.on('connection', function (socket) {
    console.log("socket.io connected");
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(compression);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


var index = require('./routes/index');
var api_tweets = require('./routes/api_tweets')

app.use('/', index);
app.use('/api/tweets', api_tweets)

app.set('port', process.env.PORT || 3000);
server.listen(app.get('port'), function () {
    console.log('Listening on port ' + app.get('port'))
});

// app.use(function (err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//         message: err.message,
//         error: err
//     });
// });
// Socket.io
// var io = require('socket.io')(server);
// io.on('connection', function (socket) {
//     console.log("connected");
// });

module.exports = io;