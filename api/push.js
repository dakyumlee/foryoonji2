module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { token, title, body } = req.body
    
    if (!token) {
      res.status(400).json({ error: 'Token is required' })
      return
    }

    if (!process.env.FCM_SERVER_KEY) {
      console.error('FCM_SERVER_KEY가 설정되지 않았습니다')
      res.status(500).json({ error: 'FCM not configured' })
      return
    }

    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Authorization": `key=${process.env.FCM_SERVER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: title || "서강준이에요",
          body: body || "윤지야, 나 지금 네 생각하고 있었어.",
          icon: "https://via.placeholder.com/192x192/5b9bd5/ffffff?text=강준"
        }
      })
    })

    if (!response.ok) {
      throw new Error(`FCM API error: ${response.status}`)
    }

    const result = await response.json()
    console.log('FCM 응답:', result)
    
    res.status(200).json({ 
      success: true,
      result: result 
    })
    
  } catch (error) {
    console.error('Push notification error:', error)
    res.status(500).json({ 
      error: 'Failed to send notification',
      details: error.message 
    })
  }
}