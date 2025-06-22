module.exports = function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }
  
    console.log('테스트 API 호출됨')
    
    res.status(200).json({ 
      message: '테스트 성공!',
      method: req.method,
      timestamp: new Date().toISOString(),
      env_check: {
        claude_api_key_exists: !!process.env.CLAUDE_API_KEY,
        fcm_server_key_exists: !!process.env.FCM_SERVER_KEY
      }
    })
  }