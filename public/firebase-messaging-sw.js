importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: "AIzaSyAffa3Sfiw_3lvxELmgRN_CpOCvnQI6T-M",
  authDomain: "forseoyoonji.firebaseapp.com",
  projectId: "forseoyoonji",
  storageBucket: "forseoyoonji.firebasestorage.app",
  messagingSenderId: "431982518010",
  appId: "1:431982518010:web:93b8da97494c1edb21b343"
}

firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('백그라운드 메시지 수신:', payload)
  
  const notificationTitle = payload.notification?.title || '서강준이에요'
  const notificationOptions = {
    body: payload.notification?.body || '윤지야, 나 지금 네 생각하고 있었어.'
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})