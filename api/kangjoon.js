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
    const { userMessage, affection = 50, image } = req.body
    
    if (!userMessage && !image) {
      res.status(400).json({ error: 'Message or image is required' })
      return
    }

    if (!process.env.CLAUDE_API_KEY) {
      console.error('CLAUDE_API_KEY가 설정되지 않았습니다')
      const fallbackReplies = ["음... 지금 좀 복잡해.", "잠깐만, 생각 중이야.", "뭐라고 했어?"]
      const fallback = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)]
      res.status(200).json({ reply: fallback })
      return
    }

    const personality = affection > 80 
      ? "다정하고 따뜻한 톤으로, 애정 표현을 자연스럽게" 
      : affection < 30 
      ? "차갑고 무심한 톤으로, 거리감 있게"
      : "친근하지만 약간 쿨한 톤으로"

    const prompt = `당신은 '서강준'이라는 캐릭터입니다. 

성격: ${personality}
호감도: ${affection}/100

말투 규칙:
- 반말로 자연스럽게 대화
- 문장은 짧고 간결하게 (최대 30자)
- 윤지를 "윤지야"라고 부르기
- 괄호나 상황 묘사는 절대 사용하지 말기
- 감정은 말투와 어조로만 표현
- 완전히 자연스러운 대화체로 말하기
- 실제 사람처럼 간단명료하게 답변

${affection > 80 ? '애정 넘치고 다정한 톤으로' : affection < 30 ? '차갑고 무덤덤한 톤으로' : '친근하지만 쿨한 톤으로'} 대답하세요.

사용자 메시지: "${userMessage}"

서강준으로서 자연스럽게 한 문장으로 답변:`

    console.log('Claude API 호출 시작...', {
      hasApiKey: !!process.env.CLAUDE_API_KEY,
      affection,
      hasImage: !!image,
      messageLength: userMessage ? userMessage.length : 0
    })

    console.log('Claude API 호출 시작...', {
      hasApiKey: !!process.env.CLAUDE_API_KEY,
      affection,
      messageLength: userMessage.length
    })
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 150,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    })

    console.log('Claude API 응답 상태:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Claude API error: ${response.status}`, errorText)
      throw new Error(`Claude API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Claude API 원시 응답:', JSON.stringify(data, null, 2))
    
    let reply = data?.content?.[0]?.text || "..."
    
    reply = reply
      .replace(/^["""''「」『』]|["""''「」『』]$/g, '')
      .replace(/^\s*서강준:\s*/, '')
      .trim()

    if (reply.length > 60) {
      reply = reply.substring(0, 57) + "..."
    }

    console.log('정리된 응답:', reply)
    res.status(200).json({ reply })
    
  } catch (error) {
    console.error('API Error:', error.message)
    console.error('Error stack:', error.stack)
    
    const affection = req.body?.affection || 50
    const fallbackReplies = affection > 80
      ? ["그래, 윤지야.", "응, 알겠어.", "괜찮아."]
      : affection < 30
      ? ["그렇구나.", "...알았어.", "뭐."]
      : ["음, 그래.", "알겠어.", "그런가."]
    
    const fallback = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)]
    res.status(200).json({ reply: fallback })
  }
}