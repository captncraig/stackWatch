
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

var pushList = require("./.data/pushes.json")
console.log(pushList)

var app = express()

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use('/', express.static('client'))
app.use(bodyParser.json());

app.post("/sub", async function(req,res){
    if(req.body){
      pushList.push(req.body);
      console.log("SUB")
      fs.writeFileSync(".data/pushes.json", JSON.stringify( pushList ), "utf8");
    }
    res.sendStatus(200)
})

app.post("/unsub", async function(req,res){
    if(req.body){
      console.log("UNSUB")
      pushList = _.reject(pushList,function(p){return p.endpoint == req.body.endpoint});
      fs.writeFileSync(".data/pushes.json", JSON.stringify( pushList ), "utf8");
    }
    res.sendStatus(200)
})

app.all('/', async function (req, res) {
    res.render('home', {site: site, site_id: siteID, tags: tags,tagsj: tags.join(" "), pub: push.publicKey() })
})

var port = process.env.PORT || 8666;
app.listen(port, function () {
     console.log(`Example app listening on port ${port}!`)
})

function onMessage(data){
    data.link = site+"/"+data.url;
    console.log(data.link)
    for (let p of pushList){
        push.sendTo(p,data)
    }
}