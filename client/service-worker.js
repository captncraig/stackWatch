self.addEventListener('push', function (event) {
  if (event.data) {
    var msg = JSON.parse(event.data.text());
    var opts = {
      body: msg.title,
      data: msg.link,
      icon: "https://cdn.sstatic.net/Sites/stackoverflow/img/apple-touch-icon@2.png",
      actions: [
        {
          action: 'go',
          title: 'View',
        },
        {
          action: 'silence',
          title: 'Silence',
        }
      ]
    }
    const promiseChain = self.registration.showNotification(`New ? Tagged [${msg.tags.join(" ")}]`, opts);
    event.waitUntil(promiseChain);
  } else {
    console.log('This push event has no data.');
  }
});

self.addEventListener('notificationclick', function (event) {
  let url = event.notification.data
  event.notification.close();
  if (event.action === 'silence') {
    url = event.target.location.origin +"/"
  }
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
}, false);