import { requestPermission } from "./firebase.js"

let affection = parseInt(localStorage.getItem("kangjoonAffection")) || 50
let messageCount = parseInt(localStorage.getItem("kangjoonDiaryCount")) || 0

function updateAffection(userInput) {
  const positiveWords = ["보고", "좋아", "그리웠", "기다렸", "행복", "고마워"]
  const negativeWords = ["짜증", "귀찮", "싫어", "안돼", "그만"]

  positiveWords.forEach(word => { if (userInput.includes(word)) affection += 5 })
  negativeWords.forEach(word => { if (userInput.includes(word)) affection -= 5 })

  affection = Math.max(0, Math.min(100, affection))
  localStorage.setItem("kangjoonAffection", affection)
}

function updateAffectionBar() {
  document.getElementById("affection-fill").style.width = `${affection}%`
}

function detectJealousyTrigger(text) {
  const jealousyTriggers = [
    "다른 남자", "잘생긴", "썸", "영화 봤어", "데이트", "남사친", "오빠", "톡 했어"
  ]
  return jealousyTriggers.some(trigger => text.includes(trigger))
}

function appendMessage(text, className) {
  const chatWindow = document.getElementById("chat-window")
  const msgDiv = document.createElement("div")
  msgDiv.className = `bubble ${className}`
  msgDiv.innerText = text
  chatWindow.appendChild(msgDiv)
  chatWindow.scrollTop = chatWindow.scrollHeight
}

async function sendMessage() {
  const input = document.getElementById("user-input")
  const message = input.value.trim()
  if (!message) return

  appendMessage(message, "user")
  input.value = ""

  updateAffection(message)
  updateAffectionBar()
  messageCount++
  localStorage.setItem("kangjoonDiaryCount", messageCount)

  if (detectJealousyTrigger(message)) {
    appendMessage("…그래. 너 마음대로 해. (시선 피한다)", "bot")
    writeJealousDiary()
    return
  }

  appendMessage("생각 중이야...", "bot")

  try {
    const res = await fetch("/api/kangjoon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: message })
    })

    const data = await res.json()
    const reply = data.reply || "…뭔가 이상한데?"
    const final = wrapKangjoonStyle(reply)
    const lastBubble = document.querySelector(".bubble.bot:last-of-type")
    if (lastBubble) {
      lastBubble.innerText = final
    }

    checkSecretRoute(message)
    maybeShowDiary()
  } catch (e) {
    console.error("API 요청 실패:", e)
    const lastBubble = document.querySelector(".bubble.bot:last-of-type")
    if (lastBubble) {
      lastBubble.innerText = "지금 생각이 복잡해... 다시 말해줄래?"
    }
  }
}

function wrapKangjoonStyle(text) {
  const softEndings = affection > 80
    ? [" (살며시 웃는다)", " (고개를 끄덕인다)", " (목소리가 부드러워진다)"]
    : affection < 30
    ? [" (말끝이 차갑다)", " (눈을 피한다)", " (한숨을 쉰다)"]
    : [" (조용히 웃는다)", " (입꼬리가 올라간다)", " (잠깐 침묵한다)"]

  const randomEnding = softEndings[Math.floor(Math.random() * softEndings.length)]

  const revised = text
    .replace(/윤지/g, "윤지야")
    .replace(/\.{3}/g, "…")
    .replace(/(.)$/, "$1.")

  return `${revised}${randomEnding}`
}

function maybeShowDiary() {
  if (messageCount >= 10 && !localStorage.getItem("kangjoonDiaryShown")) {
    setTimeout(() => {
      appendMessage("오늘 너랑 얘기 많이 했네. 그냥 혼잣말이야…", "bot")
      localStorage.setItem("kangjoonDiaryShown", "1")
    }, 2000)
  }
}

function checkSecretRoute(userInput) {
  if (affection === 100 && userInput.includes("사람처럼")) {
    appendMessage("…사실, 나도 내가 사람인 것 같아.", "bot")
  }
}

function writeJealousDiary() {
  setTimeout(() => {
    appendMessage("오늘 윤지가 다른 사람 얘기를 했다. 괜히 신경 쓰인다.", "bot")
  }, 2000)
}

async function handleNotifyClick() {
  const token = localStorage.getItem("fcmToken")
  if (!token) {
    alert("먼저 알림 권한을 허용하고 토큰을 받아야 해!")
    return
  }

  try {
    const res = await fetch("/api/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token,
        title: "서강준이에요",
        body: "윤지야, 나 지금 네 생각하고 있었어."
      })
    })

    const result = await res.json()
    console.log("푸시 전송 결과:", result)
    
    if (result.success !== undefined && result.success === 0) {
      alert("알림이 전송되었어!")
    }
  } catch (error) {
    console.error("푸시 전송 실패:", error)
    alert("알림 전송에 실패했어...")
  }
}

document.addEventListener('DOMContentLoaded', function() {

  requestPermission()
  
  const saved = localStorage.getItem("kangjoonChat")
  if (saved) {
    document.getElementById("chat-window").innerHTML = saved
  }
  
  updateAffectionBar()
  
  document.getElementById("send-button").addEventListener("click", sendMessage)
  document.getElementById("user-input").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      sendMessage()
    }
  })
  document.getElementById("notify-btn").addEventListener("click", handleNotifyClick)
})

window.addEventListener('beforeunload', function() {
  localStorage.setItem("kangjoonChat", document.getElementById("chat-window").innerHTML)
  localStorage.setItem("kangjoonAffection", affection)
  localStorage.setItem("kangjoonDiaryCount", messageCount)
})