var host = "http://twitter-assignment2.herokuapp.com"
//var host = "";

var tweets_temp = [];  // Records data for real-time tweets
var map;

init();

function init() {
    $(document).foundation();
    initMap();
    initSocket();
    d3.select("#refresh").on("click", function () {
        showAllPoints();
        hideSearchResult();
        d3.select("#search").property('value', "");
    })
    d3.select("#search").on("keyup", function () {
        d3.select("#tweets").html("");
        var key = d3.select("#search").property('value');
        if (key == "") {
            showAllPoints();
        } else {
            var keyCode = d3.event.keyCode;
            if (keyCode == 13) {
                showFilteredTweets(key);
            } else {
                showAutocomplete(key);
            }

        }
    })
//    d3.select("#select").on("click",function(e) {
//        var a = d3.select("#select").value;
//        if (a == "0") {
//            showAllPoints();
//        }
//    })
    $( "select" )
  .change(function () {
        var str = $( "select option:selected" ).text();
        showFilteredTweets(str);
    });
        
    
}


function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoidGVieXQiLCJhIjoiY2lsZmd0c3I0MXI4dHZubWMzdXdodGp6MyJ9.yHg2aSIkgkJHYgwCVpPiwg';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v8',
        center: [-73.961425, 40.786338],
        // scrollZoom: false,
        // maxZoom: 10,
        // minZoom: 10.7
        zoom: 10.7

    });
    map.on('style.load', function () {
        registerLayers();
        showAllPoints();
    });

}

function registerLayers() {
    registerLayer("marker_all", "yellow");
    registerLayer("marker_temp", "lightblue");
}

function registerLayer(name, color) {
    map.addSource(name, {
        "type": "geojson",
        "data": extractPoints([])
    });
    map.addLayer({
        "id": name,
        // "interactive": true,
        "type": "symbol",
        "source": name,
//        "paint": {
//            "circle-color": color,
//            "circle-radius": 1,
//            "circle-opacity": 1
//        }
        "layout": {
                    //"icon-image": "",
                    "icon-allow-overlap": true,
                    "text-field":"{sentiment}",
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                    "text-size": 9,
                    "text-transform": "uppercase",
                    "text-letter-spacing": 0.05,
                    "text-offset": [0, 1.5]
                },
                "paint": {
                    "text-color": "#202",
                    "text-halo-color": "#fff",
                    "text-halo-width": 2
                }
    });
}
function initSocket() {
    socket = io.connect();
    socket.on('tweet', function (tweet) {
        tweet = JSON.parse(tweet)
        showPoint(tweet);
        d3.select("#tweet").text(tweet.text);
    });
}



function showAllPoints() {
    d3.json(host + "/api/tweets", function (tweets) {
        showPoints(tweets);
    })
}

function showFilteredTweets(key) {
    d3.json(host + "/api/tweets/text/" + key + "?source=text,coordinates,sentiment", function (tweets) {
        tweets = filterUnqualifiedTweets(tweets, key);
        showSearchResult(tweets);
        showPoints(tweets);
    });
}
function showPoints(tweets) {
    hideLayer("marker_temp");
    ChangeLayerData("marker_all", tweets);
}
function showAutocomplete(key) {
    d3.json(host + '/api/tweets/text/' + key + '?source=text,sentiment', function (tweets) {
        tweets = filterUnqualifiedTweets(tweets, key);
        tweets = tweets.map(function (tweet) {
            var index = tweet.text.indexOf(key)
            tweet.text = tweet.text.substring(index, index + 20);
            tweet.text = tweet.text.replace(new RegExp(key, 'i'), '<u><b>$&</b></u>');
            return tweet;
        })
        showSearchResult(tweets);
    })
}
function hideLayer(layer) {
    ChangeLayerData(layer, []);
}
function ChangeLayerData(layer, tweets) {
    map.getSource(layer).setData(extractPoints(tweets));
}

function filterUnqualifiedTweets(tweets, key) {
    return tweets.map(function (d) {
        var index = d.text.indexOf(key)
        if (index < 0) return "";
        else return d;
    }).filter(function (d) {
        return d != "";
    })
}

function hideSearchResult() {
    d3.select("#tweets").html("");
}

function showSearchResult(tweets) {
    hideSearchResult()
    var div = d3.select("#tweets").selectAll("li").data(tweets);
    div.enter().append("li").html(function (d) { return d.text });
    div.exit().remove();
}

// For point animation
var animation = [[1, 1], [3, 1], [20, 0.5], [200, 0]];
var point_count = 0;

function showPoint(tweet) {
    tweets_temp.push(tweet);
    ChangeLayerData("marker_temp", tweets_temp);
    var cur_point = "marker_point" + point_count;
    ++point_count;
    registerLayer(cur_point, "lightblue");
    ChangeLayerData(cur_point, [tweet]);
    animatePoint(cur_point, Date.now());
}

function animatePoint(id, start_time) {
    var cur_frame = Math.floor((Date.now() - start_time) / 200);
    if (cur_frame <= 3) {
        map.setPaintProperty(id, "circle-radius", animation[cur_frame][0]);
        map.setPaintProperty(id, "circle-opacity", animation[cur_frame][1]);
        requestAnimationFrame(function () {
            animatePoint(id, start_time);
        });
    } else {
        map.removeSource(id);
        map.removeLayer(id);
    }
}


// Extract points from tweet to feed MapBox
function extractPoints(tweets) {
    var points = tweets.map(function (tweet) {
        return extractPoint(tweet);
    })
    points = {
        "type": "FeatureCollection",
        "features": points
    }
    return points;
}

function extractPoint(tweet) {
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": tweet.coordinates
        },
        "properties": {
            "sentiment": tweet.sentiment
        }
    }
}