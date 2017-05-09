const webpush = require('web-push');
const fs = require('fs');
var client = require('prom-client');

var pushes = new client.Counter('stackWatch_pushes_sent','Number of successful push sends' );
var pushErrs = new client.Counter('stackWatch_push_errors','Number of failed push sends' );

var vapidKeys;
function loadKeys() {
    const keyFile = ".data/keys.json"

    if (fs.existsSync(keyFile)) {
        return require("./" + keyFile);
    }
    var dir = '.data';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    var vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(keyFile, JSON.stringify(vapidKeys));
    return vapidKeys;
}

exports.init = function () {
    vapidKeys = loadKeys();
    webpush.setVapidDetails(
        process.env.VAPIDMAIL || 'mailto:example@yourdomain.org',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );
}

exports.sendTo = async function (sub,data) {
    try{
      await webpush.sendNotification(sub, JSON.stringify(data))
      pushes.inc()
    }catch (e){
      pushErrs.inc()
    }
}

exports.publicKey = function(){
    return vapidKeys.publicKey;
}
