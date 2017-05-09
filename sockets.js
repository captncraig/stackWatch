const WebSocket = require('ws');
const cheerio = require('cheerio')

var client = require('prom-client');

var wsErrors = new client.Counter('stackWatch_websocket_errors','Number of errors from websockets' );
var wsConnect = new client.Histogram('stackWatch_websocket_connect_time', 'Time taken to connect to websocket server');
var siteID, tags, callback;
exports.start = function (sid, t, cb) {
    siteID = sid;
    tags = t;
    callback = cb;
    connect();
}

const reconnectInterval = 3000;
var ws;
var connect = function () {
    var end = wsConnect.startTimer();
    ws = new WebSocket('wss://qa.sockets.stackexchange.com');
    ws.on('open', function () {
        end();
        console.log('socket open');
        for (var tag of tags) {
            var msg = `${siteID}-newnav-compact-questions-newest-tag-${tag}`
            console.log(msg);
            ws.send(msg)
        }
    });
    ws.on('error', function (err) {
        wsErrors.inc()
        console.log('socket error', err);
    });
    ws.on('close', function (err) {
        console.log('socket close', err);
        setTimeout(connect, reconnectInterval);
    });
    ws.on('message', function incoming(data, flags) {
        var msg = JSON.parse(data)
        if (msg.action == "hb"){
            ws.send("hb")
            return;
        }
        var data = JSON.parse(msg.data);
        const $ = cheerio.load(data.body)
        console.log("-----------------");
        var l = $(".question-hyperlink");
        var title = l.text();
        var url = l.attr('href');
        console.log(data.id, title);
        console.log(data.tags);
        var obj = {
            id: data.id,
            tags: data.tags,
            title: title,
            url: url
        }
        callback(obj);
    });
};

