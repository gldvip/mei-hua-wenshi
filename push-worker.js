self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "玄问临占";
  const options = {
    body: payload.body || "你的个人盘有新的提醒。",
    icon: "/static/app-icon-bagua.png",
    badge: "/static/app-icon-bagua.png",
    data: {
      url: payload.url || "/"
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => client.url.startsWith(self.location.origin));
    if (existing) {
      await existing.focus();
      if ("navigate" in existing) await existing.navigate(targetUrl);
      return;
    }
    await self.clients.openWindow(targetUrl);
  })());
});
