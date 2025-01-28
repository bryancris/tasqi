const CACHE_NAME = 'lovable-pwa-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.message || 'New notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
      url: data.url || '/',
      taskId: data.taskId
    },
    actions: [
      {
        action: 'view',
        title: 'View Task',
      },
      {
        action: 'complete',
        title: 'Mark Complete',
      }
    ],
    tag: data.taskId || 'default', // Ensure unique notifications per task
    renotify: true // Allow multiple notifications for same task
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'TasqiAI', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  // Get the notification data
  const data = event.notification.data;
  const url = data?.url || '/';
  const taskId = data?.taskId;

  if (event.action === 'complete' && taskId) {
    // Handle completing the task
    // Note: This would need to be implemented in the frontend
    console.log('Task marked as complete:', taskId);
  }

  // Open or focus the appropriate window/tab
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Check for scheduled tasks every minute
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-scheduled-tasks') {
    event.waitUntil(checkScheduledTasks());
  }
});

// Function to check for tasks that need notifications
async function checkScheduledTasks() {
  try {
    const now = new Date();
    const response = await fetch('/api/tasks/upcoming');
    const tasks = await response.json();

    tasks.forEach(task => {
      const taskTime = new Date(`${task.date}T${task.start_time}`);
      const timeDiff = taskTime.getTime() - now.getTime();

      // If task is due within the next minute
      if (timeDiff > 0 && timeDiff <= 60000) {
        self.registration.showNotification('Task Due Soon', {
          body: `${task.title} is starting in a minute`,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          vibrate: [100, 50, 100],
          data: {
            taskId: task.id,
            url: '/'
          },
          tag: `task-${task.id}`,
          renotify: true
        });
      }
    });
  } catch (error) {
    console.error('Error checking scheduled tasks:', error);
  }
}

// Register periodic sync if supported
if ('periodicSync' in self.registration) {
  self.registration.periodicSync.register('check-scheduled-tasks', {
    minInterval: 60000 // Check every minute
  });
}