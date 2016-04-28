var AWS = require("aws-sdk");
var AlchemyAPI = require('alchemy-api');
var fs = require("fs");
var Twit = require('twit');
var turf = require('turf');
var io = require('./server');


/*
AWS SQS
*/
var sqs = new AWS.SQS();
var queueURL = process.env.SQS_URL;

// Producer
function sendToQueue(tweet) {
    var params = {
        MessageBody: JSON.stringify(tweet),
        QueueUrl: queueURL
    }
    // console.log(tweet);
    sqs.sendMessage(params, function (err, data) {
        console.log("Sending to SQS");
        if (err) console.error(err, err.stack);
    });
}

// Consumer
function retriveFromQueue() {
    var params = {
        QueueUrl: queueURL,
        WaitTimeSeconds: 20
    };
    sqs.receiveMessage(params, function (err, message) {
        console.log('Retriving from SQS');
        if (err) console.error(err, err.stack);
        else {
            if (typeof message.Messages != 'undefined') {
                message.Messages.forEach(function (message) {
                    var tweet = JSON.parse(message.Body);
                    // console.log(tweet);
                    // console.log(message.MessageId);
                    addSentiment(tweet).then(function (tweet) {
                        publishTweet(tweet);
                        // console.log(tweet);
                        deleteMessage(message.ReceiptHandle);
                    })
                })
            }
        }
        process.nextTick(retriveFromQueue);
    });
}

function deleteMessage(receiptHandle) {
    var params = {
        QueueUrl: queueURL,
        ReceiptHandle: receiptHandle
    };
    sqs.deleteMessage(params, function (err, data) {
        if (err) console.error(err, err.stack);
    });
}

retriveFromQueue();

/*
AWS SNS
*/
var sns = new AWS.SNS();
var topicURL = process.env.SNS_URL;

function publishTweet(tweet) {
    var params = {
        Message: JSON.stringify(tweet),
        TopicArn: topicURL
    };
    console.log(params);
    sns.publish(params, function (err, data) {
        if (err) console.error(err, err.stack);
        console.log("Published to SNS");
        io.emit("tweet", tweet);
    });
}


/*
Sentiment Detection
*/
var alchemy = new AlchemyAPI(process.env.ALCHEMY_API_KEY);

function addSentiment(tweet) {
    var promise = new Promise(function (resolve, reject) {
        alchemy.sentiment('TEXT', tweet.text, function (err, response) {
            if (err) {
                if (err) console.log(err);
                reject(err);
            } else if (response.status === 'ERROR') {
                console.log(response);
            } else {
                if (typeof response.docSentiment !== "undefined") {
                    tweet.sentiment = response.docSentiment.type;
                    resolve(tweet);
                }
            }
        });
    })
    return promise;
}

/*
Read Manhattan GeoJson
*/

function readJsonFileSync(filepath, encoding) {

    if (typeof (encoding) == 'undefined') {
        encoding = 'utf8';
    }
    var file = fs.readFileSync(filepath, encoding);
    return JSON.parse(file);
}

function readJson(file) {

    var filepath = __dirname + '/' + file;
    return readJsonFileSync(filepath);
}

var manhattan = readJson('data/manhattan.geojson');

/*
Tweet stream
*/

var T = new Twit({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
})

// Fetching stream from a box containing Manhattan
var stream = T.stream('statuses/filter', { locations: "-73.999730,40.752123,-73.975167,40.762188" })

stream.on('tweet', function (tweet) {
    console.log("Received a tweet");
    tweet = validateTweet(tweet);
    if (tweet == null) return;
    console.log("Validated")
    tweet = formatTweet(tweet);
    sendToQueue(tweet);
})

function validateTweet(tweet) {
    tweet = validateGeoInfo(tweet);
    return tweet;
}

function formatTweet(tweet) {
    tweet = {
        "id": tweet.id_str,
        "text": tweet.text,
        "time": tweet.timestamp_ms,
        "coordinates": tweet.coordinates
    }
    return tweet;
}

// Validate that the point resides in Manhattan
function validateGeoInfo(tweet) {
    var point;
    if (tweet.coordinates == null) {
        var box = tweet.place.bounding_box.coordinates[0]
        // generate a random point from bounding box
        point = turf.random('points', 1, {
            bbox: [box[0][0], box[0][1], box[2][0], box[2][1]]
        }).features[0];
    } else {
        point = {
            type: "Feature",
            geometry: tweet.coordinates
        }
    }
    var valid = manhattan.features.some(function (box) {
        if (turf.inside(point, box)) {
            return true;
        }
    })
    if (valid) {
        tweet.coordinates = point.geometry.coordinates;
        return tweet;
    }
    else return null;
}


