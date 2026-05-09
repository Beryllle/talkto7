const express = require("express")
const cors = require("cors")
const axios = require("axios")

const app = express()

app.use(cors())
app.use(express.json())

// 火山配置
const APPID = "5122968957"

const TOKEN = "C0ARCwR-1uy2kvbtzz9tVR3D3VyLPxJI"

// 你的 voice_type
const VOICE_TYPE = "BV051_streaming"

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