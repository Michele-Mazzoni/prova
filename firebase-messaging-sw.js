importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyCy4N1l-LTTDOmErwlsOWJtJz-CrKZ6HfY",
  authDomain: "notifiche-diretti.firebaseapp.com",
  projectId: "notifiche-diretti",
  storageBucket: "notifiche-diretti.firebasestorage.app",
  messagingSenderId: "163088189507",
  appId: "1:163088189507:web:bfea9a6b13bf3f2a52acf6"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Ricevuto messaggio in background:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});