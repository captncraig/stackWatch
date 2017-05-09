
const push = require("./push")
var path = require("path")
var express = require('express')
var bodyParser = require('body-parser');
var exphbs  = require('express-handlebars');
var socks = require('./sockets')
var fs = require('fs')
var _ = require('lodash')

var site = process.env.SITE || "http://stackoverflow.com"
var siteID = process.env.SITE_ID || 1;

var tags = process.env.TAGS || "javascript,java,c#,go,php,android,jquery,python,html,css,c++,ios";
tags = tags.split(",")

console.log(`Site ${site} (${siteID})`)
console.log(`Watching tags ${tags}`)

push.init();
socks.start(siteID, tags, onMessage)

try{
fs.writeFileSync(".data/pushes.json", "[]", { flag: 'wx' });
}catch(err){}

var client = require('prom-client');
var numPushes = new client.Gauge('stackWatch_subs', 'Number of push subscriptions registered');

var pushList = require("./.data/pushes.json")
numPushes.set(pushList.length)

var app = express()

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use('/', express.static('client'))
app.use(bodyParser.json());

app.use(function ensureSec(req, res, next){
    if (req.headers["x-forwarded-proto"] === "https" || !req.secure){
       return next();
    }
    res.redirect("https://" + req.headers.host + req.url);  
});

app.post("/sub", async function(req,res){
    if(req.body){
      pushList.push(req.body);
      numPushes.set(pushList.length)
      console.log("SUB")
      fs.writeFileSync(".data/pushes.json", JSON.stringify( pushList ), "utf8");
    }
    res.sendStatus(200)
})

app.post("/unsub", async function(req,res){
    if(req.body){
      console.log("UNSUB")
      pushList = _.reject(pushList,function(p){return p.endpoint == req.body.endpoint});
      numPushes.set(pushList.length)
      fs.writeFileSync(".data/pushes.json", JSON.stringify( pushList ), "utf8");
    }
    res.sendStatus(200)
})

app.all('/', async function (req, res) {
    res.render('home', {site: site, site_id: siteID, tags: tags.join(" "),tagsURL:encodeURIComponent(tags.join(" ")), pub: push.publicKey(), project: process.env.PROJECT_NAME  })
})


app.get('/metrics', async function (req, res) {
    res.send(client.register.metrics());
})

var port = process.env.PORT || 8666;
app.listen(port, function () {
     console.log(`Example app listening on port ${port}!`)
})


var wsMsgs = new client.Counter('stackWatch_websocket_messages','Number of messages received via websockers' );
function onMessage(data){
    wsMsgs.inc()
    data.link = site+"/"+data.url;
    console.log(data.link)
    for (let p of pushList){
        push.sendTo(p,data)
    }
}

var request = require('request')
function makeCall() {
    request("https://"+process.env.PROJECT_NAME+".glitch.me/", function(err, data) {
        if (err) {
           console.log("PING ERR", err)
        }
      setTimeout(makeCall, 50 * 1000);
    });
}

makeCall()

