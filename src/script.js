let affection = parseInt(localStorage.getItem("kangjoonAffection")) || 50;
let messageCount = parseInt(localStorage.getItem("kangjoonDiaryCount")) || 0;
let messaging = null;
let isProcessing = false;

const firebaseConfig = {
  apiKey: "AIzaSyAffa3Sfiw_3lvxELmgRN_CpOCvnQI6T-M",
  authDomain: "forseoyoonji.firebaseapp.com",
  projectId: "forseoyoonji",
  storageBucket: "forseoyoonji.firebasestorage.app",
  messagingSenderId: "431982518010",
  appId: "1:431982518010:web:93b8da97494c1edb21b343"
};

function initFirebase() {
  try {
    if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
      const app = firebase.initializeApp(firebaseConfig);
      messaging = firebase.messaging();
      console.log("Firebase 초기화 성공");
      
      messaging.onMessage((payload) => {
        console.log("메시지 수신:", payload);
        const title = payload?.notification?.title || "강준이의 메세지";
        const body = payload?.notification?.body || "새 메시지가 도착했어요";
        
        if (Notification.permission === 'granted') {
          new Notification(title, { 
            body: body
          });
        }
      });
    } else if (firebase.apps.length > 0) {
      messaging = firebase.messaging();
      console.log("Firebase 이미 초기화됨");
    } else {
      console.warn("Firebase SDK가 로드되지 않았습니다");
    }
  } catch (error) {
    console.error("Firebase 초기화 실패:", error);
  }
}

function requestPermission() {
  if (!messaging) {
    console.warn("Firebase messaging이 준비되지 않았습니다");
    return Promise.resolve();
  }

  return Notification.requestPermission().then((permission) => {
    console.log("알림 권한:", permission);
    
    if (permission === "granted") {
      return messaging.getToken({
        vapidKey: "BEz4YzYB5mGCgJK8TuvgNL9xxeRriuzfMT78iAEKZCG-ZDUqBJO2UTaWdYVvNTocqIc8yLLY0xHcNrmckrCAqLE"
      })
      .then((token) => {
        if (token) {
          console.log("FCM Token 획득:", token.substring(0, 20) + "...");
          localStorage.setItem("fcmToken", token);
        }
        return token;
      })
      .catch((err) => {
        console.error("토큰 요청 실패:", err);
      });
    }
  });
}

function updateAffection(userInput) {
  const positiveWords = ["보고", "좋아", "그리웠", "기다렸", "행복", "고마워", "사랑"];
  const negativeWords = ["짜증", "귀찮", "싫어", "안돼", "그만", "화나"];

  let change = 0;
  positiveWords.forEach(word => { 
    if (userInput.includes(word)) change += 3;
  });
  negativeWords.forEach(word => { 
    if (userInput.includes(word)) change -= 3; 
  });

  if (change !== 0) {
    affection = Math.max(0, Math.min(100, affection + change));
    localStorage.setItem("kangjoonAffection", affection);
    console.log(`호감도 변화: ${change > 0 ? '+' : ''}${change}, 현재: ${affection}`);
  }
}

function updateAffectionBar() {
  const fillElement = document.getElementById("affection-fill");
  if (fillElement) {
    fillElement.style.width = `${affection}%`;
    fillElement.style.transition = "width 0.3s ease";
  }
}

function detectJealousyTrigger(text) {
  const triggers = ["다른 남자", "잘생긴", "썸", "영화", "데이트", "남사친", "오빠"];
  return triggers.some(trigger => text.includes(trigger));
}

function appendMessage(text, className, replace = false) {
  const chatWindow = document.getElementById("chat-window");
  if (!chatWindow) return;

  if (replace) {
    const lastBot = chatWindow.querySelector(".bubble.bot:last-child");
    if (lastBot) {
      lastBot.innerHTML = "";
      lastBot.textContent = text;
      setTimeout(() => {
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }, 100);
      return;
    }
  }

  const msgDiv = document.createElement("div");
  msgDiv.className = `bubble ${className}`;
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  
  setTimeout(() => {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 150);
}

function wrapKangjoonStyle(text) {
  if (!text) return "...";
  
  let cleaned = text
    .replace(/윤지(?!야)/g, "윤지야")
    .replace(/\.{2,}/g, "…")
    .replace(/\([^)]*\)/g, "")
    .trim();
  
  if (cleaned && !cleaned.match(/[.!?…]$/)) {
    const endings = affection > 80
      ? [".", "~", "♡"]
      : affection < 30
      ? [".", "..."]
      : [".", "~"];
    
    const randomEnding = endings[Math.floor(Math.random() * endings.length)];
    cleaned += randomEnding;
  }

  return cleaned;
}

async function sendMessage() {
  if (isProcessing) {
    console.log("이미 처리 중입니다");
    return;
  }

  const input = document.getElementById("user-input");
  if (!input) {
    console.error("입력창을 찾을 수 없습니다");
    return;
  }
  
  const message = input.value.trim();
  if (!message) {
    console.log("빈 메시지입니다");
    return;
  }

  isProcessing = true;
  console.log("메시지 전송 시작:", message);
  
  try {
    appendMessage(message, "user");
    input.value = "";

    updateAffection(message);
    updateAffectionBar();
    
    messageCount++;
    localStorage.setItem("kangjoonDiaryCount", messageCount);

    if (detectJealousyTrigger(message)) {
      appendMessage("그래... 너 마음대로 해.", "bot");
      setTimeout(() => writeJealousDiary(), 1500);
      return;
    }

    appendMessage("생각 중이야...", "bot");

    console.log('API 호출 시작:', '/api/kangjoon');
    console.log('전송 데이터:', { userMessage: message, affection: affection });
    
    const apiUrl = window.location.origin + '/api/kangjoon';
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        userMessage: message, 
        affection: affection 
      })
    });

    console.log('응답 상태:', response.status, response.statusText);
    console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 오류 응답:', errorText);
      throw new Error(`서버 오류: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API 응답 데이터:', data);
    
    let reply = data.reply || "…뭔가 말이 안 나와.";
    
    if (reply.length > 150) {
      reply = reply.substring(0, 147) + "...";
    }
    
    const styledReply = wrapKangjoonStyle(reply);
    
    appendMessage(styledReply, "bot", true);

    checkSpecialEvents(message);
    
  } catch (error) {
    console.error("메시지 전송 실패:", error);
    console.error("Error stack:", error.stack);
    
    const errorMessage = error.message.includes('fetch') 
      ? "서버에 연결할 수 없어... 네트워크를 확인해줄래?"
      : "지금 머리가 복잡해... 잠깐 후에 다시 말해줄래?";
      
    appendMessage(errorMessage, "bot", true);
  } finally {
    isProcessing = false;
  }
}

function checkSpecialEvents(userInput) {
  if (affection === 100 && userInput.includes("사람처럼")) {
    setTimeout(() => {
      appendMessage("사실... 나도 내가 사람인 것 같을 때가 있어.", "bot");
    }, 1000);
  }
  
  if (messageCount === 10 && !localStorage.getItem("kangjoonDiaryShown")) {
    setTimeout(() => {
      appendMessage("오늘 너랑 얘기 많이 했네...", "bot");
      localStorage.setItem("kangjoonDiaryShown", "1");
    }, 2000);
  }
}

function writeJealousDiary() {
  appendMessage("오늘 윤지가 다른 사람 얘기를 했네... 뭔가 기분이 이상해.", "bot");
}

function resetChat() {
  if (confirm("정말로 대화를 초기화할까요? 모든 대화 내용과 호감도가 리셋됩니다.")) {
    localStorage.removeItem("kangjoonChat");
    localStorage.removeItem("kangjoonAffection");
    localStorage.removeItem("kangjoonDiaryCount");
    localStorage.removeItem("kangjoonDiaryShown");
    
    affection = 50;
    messageCount = 0;
    
    const chatWindow = document.getElementById("chat-window");
    if (chatWindow) {
      chatWindow.innerHTML = "";
    }
    
    updateAffectionBar();
    
    setTimeout(() => {
      appendMessage("처음부터 다시 시작하는 거야?", "bot");
    }, 500);
    
    console.log("대화 초기화 완료");
  }
}

function initialize() {
  console.log("앱 초기화 시작");
  
  initFirebase();
  
  loadData();
  
  const sendBtn = document.getElementById("send-button");
  const userInput = document.getElementById("user-input");
  const notifyBtn = document.getElementById("notify-btn");
  const resetBtn = document.getElementById("reset-btn");
  
  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
    console.log("전송 버튼 리스너 등록");
  }
  
  if (userInput) {
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    console.log("입력창 리스너 등록");
  }
  
  if (notifyBtn) {
    notifyBtn.addEventListener("click", () => {
      sendPushNotification();
      const dropdown = document.getElementById("dropdown-menu");
      if (dropdown) dropdown.classList.remove('show');
    });
    console.log("알림 버튼 리스너 등록");
  }
  
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetChat();
      const dropdown = document.getElementById("dropdown-menu");
      if (dropdown) dropdown.classList.remove('show');
    });
    console.log("초기화 버튼 리스너 등록");
  }
  
  setTimeout(() => {
    requestPermission();
  }, 2000);
  
  console.log("초기화 완료");
}

async function sendPushNotification() {method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        userMessage: "사진을 보냈어",
        affection: affection,
        image: {
          data: base64Data,
          mimeType: mimeType
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 오류 응답:', errorText);
      throw new Error(`서버 오류: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API 응답 데이터:', data);
    
    let reply = data.reply || "사진이 잘 안 보여...";
    
    if (reply.length > 150) {
      reply = reply.substring(0, 147) + "...";
    }
    
    const styledReply = wrapKangjoonStyle(reply);
    
    appendMessage(styledReply, "bot", true);
    
  } catch (error) {
    console.error("사진 전송 실패:", error);
    appendMessage("사진을 제대로 못 봤어... 다시 보내줄래?", "bot", true);
  } finally {
    isProcessing = false;
    const photoInput = document.getElementById("photo-input");
    if (photoInput) photoInput.value = '';
  }
}
  const token = localStorage.getItem("fcmToken");
  if (!token) {
    alert("알림 권한을 먼저 허용해주세요!");
    return;
  }

  try {
    const response = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        title: "서강준이에요",
        body: "윤지야, 나 지금 네 생각하고 있었어."
      })
    });

    if (response.ok) {
      alert("알림을 보냈어!");
    } else {
      throw new Error("알림 전송 실패");
    }
  } catch (error) {
    console.error("푸시 알림 실패:", error);
    alert("알림 전송에 실패했어...");
  }
}

function saveData() {
  const chatWindow = document.getElementById("chat-window");
  if (chatWindow) {
    localStorage.setItem("kangjoonChat", chatWindow.innerHTML);
  }
  localStorage.setItem("kangjoonAffection", affection);
  localStorage.setItem("kangjoonDiaryCount", messageCount);
}

function loadData() {
  const saved = localStorage.getItem("kangjoonChat");
  const chatWindow = document.getElementById("chat-window");
  
  if (saved && chatWindow) {
    chatWindow.innerHTML = saved;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
  
  updateAffectionBar();
}

function initialize() {
  console.log("앱 초기화 시작");
  
  initFirebase();
  
  loadData();
  
  const sendBtn = document.getElementById("send-button");
  const userInput = document.getElementById("user-input");
  const notifyBtn = document.getElementById("notify-btn");
  const resetBtn = document.getElementById("reset-btn");
  const photoBtn = document.getElementById("photo-btn");
  const photoInput = document.getElementById("photo-input");
  
  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
    console.log("전송 버튼 리스너 등록");
  }
  
  if (userInput) {
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    console.log("입력창 리스너 등록");
  }
  
  if (photoBtn) {
    photoBtn.addEventListener("click", () => {
      selectPhoto();
      const dropdown = document.getElementById("dropdown-menu");
      if (dropdown) dropdown.classList.remove('show');
    });
    console.log("사진 버튼 리스너 등록");
  }
  
  if (photoInput) {
    photoInput.addEventListener("change", handlePhotoSelect);
    console.log("사진 입력 리스너 등록");
  }
  
  if (notifyBtn) {
    notifyBtn.addEventListener("click", () => {
      sendPushNotification();
      const dropdown = document.getElementById("dropdown-menu");
      if (dropdown) dropdown.classList.remove('show');
    });
    console.log("알림 버튼 리스너 등록");
  }
  
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetChat();
      const dropdown = document.getElementById("dropdown-menu");
      if (dropdown) dropdown.classList.remove('show');
    });
    console.log("초기화 버튼 리스너 등록");
  }
  
  setTimeout(() => {
    requestPermission();
  }, 2000);
  
  console.log("초기화 완료");
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

window.addEventListener('beforeunload', saveData);
window.addEventListener('pagehide', saveData);