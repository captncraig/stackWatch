
const push = require("./push")
var path = require("path")
var express = require('express')
var bodyParser = require('body-parser');
var exphbs  = require('express-handlebars');
var socks = require('./sockets')
var fs = require('fs')

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
      console.log(pushList);
    }
    res.sendStatus(200)
})

app.all('/', async function (req, res) {
    res.render('home', {site: site, site_id: siteID, tags: tags, pub: push.publicKey() })
})

var port = process.env.PORT || 8666;
app.listen(port, function () {
     console.log(`Example app listening on port ${port}!`)
})

function onMessage(data){
    data.link = site+"/"+data.url;
    console.log(data.link)
    for (p of pushList){
        push.sendTo(p,data)
    }
}