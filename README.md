# Twitter-Map

Github Page <https://github.com/Tebyt/twitter-assignment2>

The website is deployed on heroku and is hosted on <http://twitter-assignment2.herokuapp.com>

The elasticsearch database is provided by [Searchly](http://www.searchly.com)

### API Reference

####Root: /api/tweets

**GET /** Get all the tweets

**GET /text/:toSearch?fields=text,time,sentiment,coordinates** Get tweets by text (fields could contain 1-4 elements seperated by ',')


**GET /sentiment/:toSearch?fields=text,time,sentiment,coordinates** Get tweets by sentiment (fields could contain 1-4 elements seperated by ',')



### Thanks to

**MapBox** Map provider

**Twit** Twitter Streaming for Node.js

**Socket.io** Real time server to client messaging
