var express = require('express');
var router = express.Router();
var db = require('../db.js');
var bodyParser = require("body-parser");
var io;

// For solving AWS problem
var overrideContentType = function (req, res, next) {
    if (req.headers['x-amz-sns-message-type']) {
        req.headers['content-type'] = 'application/json;charset=UTF-8';
    }
    next();
};

router.post('/', overrideContentType);
router.use(bodyParser.json());

// Main

var extractMessage = function (req, res, next) {
    if (req.headers['x-amz-sns-message-type']) {
        req.body = req.body.Message;
    }
    next();
}
router.post('/', extractMessage)
router.post('/', function (req, res) {
    io.emit("tweet", req.body);
    db.addTweet(req.body)
        .then(function (resp) {
            res.json(resp)
        });
})
router.get('/', function (req, res) {
    db.getAllPoints()
        .then(function (data) {
            res.json(data)
        })
        .catch(function (err) {
            res.status(500).json(err)
        })
})
// router.get('/', function (req, res) {
//     db.getAllTweets().then(function (data) {
//         res.json(data);
//     }, function (err) {
//         res.status(500).json(err)
//     });
// });
router.delete('/', function (req, res) {
    db.deleteAndCreateIndex().then(function (resp) {
        res.send(resp)
    });
})
router.get('/text/:toSearch', function (req, res) {
    var source = req.query.source.split(',')
    db.searchByText(req.params.toSearch, source).then(function (data) {
        res.json(data);
    }, function (err) {
        res.status(500).json(err)
    });
});
router.get('/sentiment/:toSearch', function (req, res) {
    var source = req.query.source.split(',')
    db.searchBySentiment(req.params.toSearch, source).then(function (data) {
        res.json(data);
    }, function (err) {
        res.status(500).json(err)
    });
})
// router.get('/coordinates/:lat/:lon', function (req, res) {
//     db.searchByCoordinates(req.params).then(function (data) {
//         res.json(data);
//     }, function (err) {
//         res.status(500).json(err)
//     });
// })
// router.get('/text/autocomplete/:toSearch', function (req, res) {
//     // console.log(req.params.toSearch);
//     db.searchByText(req.params.toSearch).then(function (data) {
//         res.json(data);
//     }, function (err) {
//         console.trace(err.message);
//         res.json("[]");
//     });
// })
module.exports = function(socket) {
    io = socket;
    return router;
}