var elasticsearch = require('elasticsearch');

var index_name = "twitter";
var type_name = "tweets";

var client = new elasticsearch.Client({
    host: process.env.ELASTICSEARCH_URL,
    // host: '127.0.0.1:9200',
    log: ['error', 'warning']
});
createIndexIfNotExist();

function deleteAndCreateIndex() {
    deleteIndex().then(createIndex);
}
function createIndexIfNotExist() {
    indexExists().then(function (exists) {
        if (!exists) {
            createIndex();
        } else console.log("index exists");
    })
}
function closeIndex() {
    console.log("close index");
    return client.indices.close({
        index: index_name
    });
}
function openIndex() {
    console.log("open index");
    return client.indices.open({
        index: index_name
    });
}
function deleteIndex() {
    console.log("delete index");
    return client.indices.delete({
        index: index_name
    });
}
function initIndex() {
    console.log("init index");
    return client.indices.create({
        index: index_name
    });
}
function indexExists() {
    return client.indices.exists({
        index: index_name
    });
}
function createIndex() {
    console.log("creating index");
    initIndex()
        .then(closeIndex)
        .then(initSetting)
        .then(openIndex)
        .then(initMapping);
}
function initMapping() {
    console.log("init mapping");
    return client.indices.putMapping({
        index: index_name,
        type: type_name,
        body: {
            "properties": {
                "_id": {
                    "type": "string"
                },
                "text": {
                    "type": "string",
                    "analyzer": "nGram_analyzer",
                    "search_analyzer": "whitespace_analyzer"
                },
                "time": {
                    "type": "string"
                },
                "coordinates": {
                    "type": "geo_point"
                },
                "sentiment": {
                    "type": "string"
                }
            }
        }
    });
}
function initSetting() {
    console.log("init settings");
    return client.indices.putSettings({
        "index": index_name,
        "body": {
            "analysis": {
                "filter": {
                    "nGram_filter": {
                        "type": "nGram",
                        "min_gram": 1,
                        "max_gram": 10,
                        "token_chars": [
                            "letter",
                            "digit",
                            "punctuation",
                            "symbol"
                        ]
                    }
                },
                "analyzer": {
                    "nGram_analyzer": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": [
                            "lowercase",
                            "asciifolding",
                            "nGram_filter"
                        ]
                    },
                    "whitespace_analyzer": {
                        "type": "custom",
                        "tokenizer": "whitespace",
                        "filter": [
                            "lowercase",
                            "asciifolding"
                        ]
                    }
                }
            }
        }
    })
}

function addTweet(document, id) {
    return client.index({
        index: index_name,
        type: type_name,
        id: id,
        body: document
    });
}

function searchByText(text) {
    return client.search({
        index: index_name,
        type: type_name,
        body: {
            query: {
                "match": {
                    "properties.text": text
                }
            },
            size: 2000
        }
    }).then(function (data) {
        data = data.hits.hits;
        data = data.map(function (d) {
            return d._source
        })
        return data;
    })
}

function searchByCoordinates(coordinates, diameter) {
    return client.search({
        index: index_name,
        type: type_name,
        body: {
            "query": {
                "bool": {
                    "must": {
                        "match_all": {}
                    },
                    "filter": {
                        "geo_distance": {
                            "distance": "1km",
                            "geometry.coordinates": coordinates
                        }
                    }
                }
            },
            "size": 100
        }
    }).then(function (data) {
        data = data.hits.hits;
        data = data.map(function (d) {
            return d._source
        })
        return data;
    })
}

function getAllTweets() {
    return client.search({
        index: index_name,
        type: type_name,
        body: {
            query: {
                "match_all": {}
            },
            size: 2000
        }
    }).then(function (data) {
        data = data.hits.hits;
        data = data.map(function (d) {
            return d._source
        })
        return data;
    })
}

module.exports = {
    createIndexIfNotExist: createIndexIfNotExist,
    addTweet: addTweet,
    searchByText: searchByText,
    getAllTweets: getAllTweets,
    deleteAndCreateIndex: deleteAndCreateIndex,
    searchByCoordinates: searchByCoordinates
}

