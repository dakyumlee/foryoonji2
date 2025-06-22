import { initializeApp } from "firebase/app"
import { getMessaging, getToken, onMessage } from "firebase/messaging"

const firebaseConfig = {
  apiKey: "AIzaSyAffa3Sfiw_3lvxELmgRN_CpOCvnQI6T-M",
  authDomain: "forseoyoonji.firebaseapp.com",
  projectId: "forseoyoonji",
  storageBucket: "forseoyoonji.firebasestorage.app",
  messagingSenderId: "431982518010",
  appId: "1:431982518010:web:93b8da97494c1edb21b343",
  measurementId: "G-LBD35Z47NB"
}

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

getToken(messaging, {
    vapidKey: "BEz4YzYB5mGCgJK8TuvgNL9xxeRriuzfMT78iAEKZCG-ZDUqBJO2UTaWdYVvNTocqIc8yLLY0xHcNrmckrCAqLE"
  })
    .then((token) => {
      console.log("FCM Token:", token)
      localStorage.setItem("fcmToken", token)
    })  

export function requestPermission() {
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      getToken(messaging, {
        vapidKey: "BEz4YzYB5mGCgJK8TuvgNL9xxeRriuzfMT78iAEKZCG-ZDUqBJO2UTaWdYVvNTocqIc8yLLY0xHcNrmckrCAqLE"
      })
        .then((token) => {
          console.log("FCM Token:", token)
        })
        .catch((err) => {
          console.error("토큰 요청 실패", err)
        })
    } else {
      console.warn("알림 권한 거부됨")
    }
  })
}

onMessage(messaging, (payload) => {
  console.log("📥 포그라운드 메시지 수신:", payload)
  alert(payload?.notification?.title || "강준이의 메세지가 도착했어요.")
})
