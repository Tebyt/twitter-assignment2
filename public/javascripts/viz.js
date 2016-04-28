$(document).foundation();
mapboxgl.accessToken = 'pk.eyJ1IjoidGVieXQiLCJhIjoiY2lsZmd0c3I0MXI4dHZubWMzdXdodGp6MyJ9.yHg2aSIkgkJHYgwCVpPiwg';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v8',
    center: [-73.961425, 40.786338],
    // scrollZoom: false,
    // maxZoom: 10,
    // minZoom: 10.7
    zoom: 10.7

});
var host = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');

d3.select("#refresh").on("click", function () {
    showAllPoints();
    hideTweets();
    d3.select("#search").property('value', "");
})
map.on('click', function (data) {
    data = data.lngLat;
    var url = '/api/coordinates/' + data.lat + '/' + data.lng;
    console.log(url);

    d3.json(url, function (data) {
        // console.log(data);
        showFull(data);
    });
    //   var e = data && data.originalEvent;
    //   console.log('got click ' + (e ? 'button = ' + e.button : ''));
});

map.on('style.load', function () {
    init();
});
function init() {
    registerMarkers();
    registerSocket();
    fetchAllPoints();
}

function registerMarkers() {
    registerMarker("marker_all", "yellow");
    registerMarker("marker_search", "yellow");
    registerMarker("marker_temp", "lightblue");
}

function registerMarker(name, color) {
    window[name] = {
        "type": "FeatureCollection",
        "features": []
    }
    map.addSource(name, {
        "type": "geojson",
        "data": window[name]
    });
    map.addLayer({
        "id": name,
        // "interactive": true,
        "type": "circle",
        "source": name,
        "paint": {
            "circle-color": color,
            "circle-radius": 1,
            "circle-opacity": 1
        }
    });
}
function registerSocket() {
    socket = io.connect();
    socket.on('tweet', function (tweet) {
        var point = formatPoint(JSON.parse(tweet));
        showPoint(point);
        d3.select("#tweet").text(tweet.text);
    });
}



function emptyData(marker) {
    window[marker].features = [];
    refreshData(marker);
}
function refreshData(marker) {
    map.getSource(marker).setData(window[marker]);
}

function fetchAllPoints() {
    console.log("fetching data");
    d3.json("/api/tweets", function (points) {
        console.log("fetched");
        // console.log(points);
        points = formatPoints(points);
        marker_all.features = points;
        showAllPoints();
    })
}

function showAllPoints() {
    emptyData("marker_temp");
    refreshData("marker_all");
    map.setLayoutProperty("marker_search", 'visibility', 'none');
    map.setLayoutProperty("marker_all", 'visibility', 'visible');
}

function fetchPointsByText(key, callback) {
    console.log("fetching data");
    d3.json("/api/tweets/text/" + key + "?source=text,coordinates,sentiment", function (data) {
        callback(filterUnqualified(data, key));
    });
}

function showFilteredPoints(data) {
    marker_search.features = data;
    emptyData("marker_temp");
    refreshData("marker_search");
    map.setLayoutProperty("marker_all", 'visibility', 'none');
    map.setLayoutProperty("marker_search", 'visibility', 'visible');
}

d3.select("#search").on("keyup", function () {
    d3.select("#tweets").html("");
    var key = d3.select("#search").property('value');
    if (key == "") {
        showAllPoints();
        return;
    }
    var keyCode = d3.event.keyCode;
    if (keyCode == 13) {
        fetchPointsByText(key, function (data) {
            showFull(data);
        })
    } else {
        showAutocomplete(key);
    }
})
function filterUnqualified(data, key) {
    return data.map(function (d) {
        var index = d.text.indexOf(key)
        if (index < 0) return "";
        else return d;
    }).filter(function (d) {
        return d != "";
    })
}
function filterUnqualifiedForTweet(data, key) {
    console.log(data);
    return data.map(function (d) {
        var index = d.text.indexOf(key)
        if (index < 0) return "";
        else return d;
    }).filter(function (d) {
        return d != "";
    })
}
function showAutocomplete(key) {
    d3.json('/api/tweets/text/' + key +'?source=text,sentiment', function (tweets) {
        console.log(tweets);
        tweets = filterUnqualifiedForTweet(tweets, key);
        // if (tweets.length > 0) {
        console.log(tweets);
        tweets = tweets.map(function (d) {
            var index = d.text.indexOf(key)
            d.text = d.text.substring(index, index + 20);
            d.text = d.text.replace(new RegExp(key, 'i'), '<u><b>$&</b></u>');
            return d;
        })
        // }
        showTweets(tweets);
    })
}
function showFull(data) {
    if (data.length > 0) {
        var tweets = data.map(function (d) {
            return {
                text: d.text,
                sentiment: d.sentiment
            }
        })
        showTweets(tweets);
        showFilteredPoints(formatPoints(data));
    }
}

function hideTweets() {
    d3.select("#tweets").html("");
}

function showTweets(tweets) {
    hideTweets()
    console.log(tweets);
    var div = d3.select("#tweets").selectAll("li").data(tweets);
    div.enter().append("li").html(function (d) { return d.text });
    div.exit().remove();
}
// function showTweets(data, key) {
//     data.forEach(function (d) {
//         showTweet(d.properties, key, "#tweets");
//     })

// }
// function showTweet(tweet, key, div) {
//     var text = $('<span class="tweet">').text(tweet.text);
//     var str = text.text().replace(key, '<h3>$1</h3>');
//     text.html(str);
//     var t = $('<li>');
//     //   t.append($('<img>').attr('src', data.img));
//     t.append(text);
//     //   t.append($('<a class="time">')
//     //    .attr('href', 'https://twitter.com/' + data.user + '/status/' + data.id)
//     //    .attr('target', '_blank')
//     //    .data('time', data.at)
//     //    .text(pretty(data.at) || 'now')
//     //   );
//     $(div).append(t);
// }


// For point animation
var animation = [[1, 1], [3, 1], [20, 0.5], [200, 0]];
var id = 0;
var start_time;

function showPoint(point) {
    marker_all.features.push(point);
    marker_temp.features.push(point);
    refreshData("marker_temp");

    var cur_point = "marker_point" + id;
    ++id;
    registerMarker(cur_point, "lightblue");
    window[cur_point].features = [point];
    refreshData(cur_point);
    start_time = Date.now();
    animatePoint(cur_point);
}

function animatePoint(id) {
    var cur_frame = Math.floor((Date.now() - start_time) / 200);
    if (cur_frame <= 3) {
        map.setPaintProperty(id, "circle-radius", animation[cur_frame][0]);
        map.setPaintProperty(id, "circle-opacity", animation[cur_frame][1]);
        requestAnimationFrame(function () {
            animatePoint(id);
        });
    } else {
        map.removeSource(id);
        map.removeLayer(id);
    }
}

function formatPoints(points) {
    points = points.map(function (p) {
        return formatPoint(p);
    })
    return points;
}

function formatPoint(point) {
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": point.coordinates
        }, 
        "properties" : {
            "sentiment": point.sentiment
        }
    }
}