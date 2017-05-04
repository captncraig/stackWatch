const webpush = require('web-push');
const fs = require('fs');

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

exports.sendTo = function (sub,data) {
    console.log("sending")
    webpush.sendNotification(sub, JSON.stringify(data))
    console.log("done")
}

exports.publicKey = function(){
    return vapidKeys.publicKey;
}
