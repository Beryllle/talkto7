const express = require("express")
const cors = require("cors")
const axios = require("axios")
const fs = require("fs")
const path = require("path")

const app = express()

app.use(cors())
app.use(express.json())

// 读取knowledge目录所有Markdown
// =========================
function loadKnowledge() {

  const folder = path.join(__dirname, "knowledge")

  if (!fs.existsSync(folder)) {
    return ""
  }

  const files = fs.readdirSync(folder)

  let knowledge = ""

  files.forEach(file => {

    if (file.endsWith(".md")) {

      knowledge += "\n\n========================\n"
      knowledge += file + "\n"
      knowledge += "========================\n\n"

      knowledge += fs.readFileSync(
        path.join(folder, file),
        "utf8"
      )

      knowledge += "\n\n"

    }

  })

  return knowledge

}

// 火山配置
const APPID = "5122968957"

const TOKEN = "C0ARCwR-1uy2kvbtzz9tVR3D3VyLPxJI"

// 你的 voice_type
const VOICE_TYPE = "BV051_streaming"

// 豆包配置
const API_KEY = "ark-fc480865-2676-46dc-95e5-9a066a244cb4-e5c49"

const MODEL = "ep-20260507164321-l4ppb"

// AI问答接口
// =========================
app.post("/chat", async (req, res) => {

  try {

    const question = req.body.question

    const knowledge = loadKnowledge()

    console.log("收到问题：", question)

    const response = await axios.post(

      "https://ark.cn-beijing.volces.com/api/v3/chat/completions",

      {

        model: MODEL,

        messages: [

          {

            role: "system",

            content: `
你是深国创中心AI数字人小七。

下面是知识库：

${knowledge}

回答规则：

1、只能依据知识库回答。

2、回答控制50字以内。

3、回答自然亲切。

4、如果知识库没有相关内容，请回答：

"抱歉，这个问题目前不在我的知识范围内。"
`

          },

          {

            role: "user",

            content: question

          }

        ]

      },

      {

        headers: {

          Authorization: `Bearer ${API_KEY}`,

          "Content-Type": "application/json"

        }

      }

    )

    res.json({

      answer:
        response.data.choices[0].message.content

    })

  }

  catch (err) {

    console.log(err.response?.data || err)

    res.json({

      answer: "抱歉，我暂时无法回答。"

    })

  }

})


// TTS接口
app.post("/tts", async (req, res) => {

  try {

    const text = req.body.text

    console.log("收到文本:", text)

    // 请求火山TTS
    const response = await axios.post(

      "https://openspeech.bytedance.com/api/v1/tts",

      {

        app: {

          appid: APPID,

          token: TOKEN,

          cluster: "volcano_tts",
        },

        user: {

          uid: "user_001",
        },

        audio: {

          voice_type: VOICE_TYPE,

          encoding: "mp3",

          speed_ratio: 1.5,

          volume_ratio: 1.0,

          pitch_ratio: 1.1,
        },

        request: {

          reqid: Date.now().toString(),

          text: text,

          text_type: "plain",

          operation: "query",
        },
      },

      {

        headers: {

          Authorization: `Bearer;${TOKEN}`,

          "Content-Type": "application/json",
        },

        responseType: "json",
      }
    )

    // 获取base64音频
    const audioBase64 = response.data.data

    if (!audioBase64) {

      console.log("没有返回音频")

      return res.status(500).send("TTS失败")
    }

    // 转buffer
    const audioBuffer = Buffer.from(
      audioBase64,
      "base64"
    )

    console.log("音频生成成功")

    // 直接返回buffer
    res.set({

      "Content-Type": "audio/mpeg",

      "Content-Length": audioBuffer.length,
    })

    res.end(audioBuffer)

  } catch (error) {

    console.log("TTS错误:")

    console.log(
      error.response?.data || error.message
    )

    res.status(500).send("TTS失败")
  }
})

// 启动服务
app.listen(3000, () => {

  console.log(
    "服务器启动：http://localhost:3000"
  )
})