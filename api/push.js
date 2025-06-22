export default async function handler(req, res) {
    const { token, title, body } = req.body
  
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Authorization": `key=${process.env.FCM_SERVER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title,
          body,
          icon: "/icon-192.png"
        }
      })
    })
  
    const result = await response.json()
    res.status(200).json(result)
  }
  