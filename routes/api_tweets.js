var express = require('express');
var router = express.Router();
var db = require('../db.js');
var bodyParser = require("body-parser");


// For solving AWS problem
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
router.post('/', overrideContentType);
router.use(bodyParser.json());
router.post('/', extractMessage)

// Main


router.post('/', function (req, res) {
    db.addTweet(req.body)
        .then(function (resp) {
            res.json(resp)
        });
})
router.get('/', function (req, res) {
    db.getAllTweets().then(function (data) {
        res.json(data);
    }, function (err) {
        console.trace(err.message);
        res.json("[]");
    });
});
router.delete('/', function (req, res) {
    db.deleteAndCreateIndex().then(function (resp) {
        res.send(resp)
    });
})
router.get('/text/:toSearch', function (req, res) {
    db.searchByText(req.params.toSearch).then(function (data) {
        res.json(data);
    }, function (err) {
        console.trace(err.message);
        res.json("[]");
    });
});
router.get('/coordinates/:lat/:lon', function (req, res) {
    db.searchByCoordinates(req.params).then(function (data) {
        res.json(data);
    }, function (err) {
        console.trace(err.message);
        res.json("[]");
    });
})
router.get('/text/autocomplete/:toSearch', function (req, res) {
    // console.log(req.params.toSearch);
    db.searchByText(req.params.toSearch).then(function (data) {
        data = data.map(function (d) {
            return d.properties.text;
        })
        res.json(data);
    }, function (err) {
        console.trace(err.message);
        res.json("[]");
    });
})
module.exports = router;