importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: "AIzaSyAffa3Sfiw_3lvxELmgRN_CpOCvnQI6T-M",
  authDomain: "forseoyoonji.firebaseapp.com",
  projectId: "forseoyoonji",
  storageBucket: "forseoyoonji.firebasestorage.app",
  messagingSenderId: "431982518010",
  appId: "1:431982518010:web:93b8da97494c1edb21b343",
  measurementId: "G-LBD35Z47NB"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(function(payload) {
  console.log("📩 background message: ", payload)
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon-192.png"
  })
})
