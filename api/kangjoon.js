export default async function handler(req, res) {
    const { userMessage } = req.body
  
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3.5-sonnet-20240620",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `다음은 '서강준 스타일 AI'의 대답 예시야. 말투는 다정하지만 무심하게. 말끝은 감정 없이 단호하게 끝나지만, 가끔 조용히 웃는 표현이 들어가도 돼.\n\n[입력]: ${userMessage}\n[서강준]:`
          }
        ]
      })
    })
  
    const data = await response.json()
    const reply = data?.content?.[0]?.text || "응답에 문제가 있어."
  
    res.status(200).json({ reply })
  }
  