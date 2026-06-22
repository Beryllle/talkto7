const video = document.getElementById("avatarVideo")

const micBtn = document.getElementById("micBtn")

const statusText = document.getElementById("status")

const replyBox = document.getElementById("replyBox")

const textInput = document.getElementById("textInput")

const sendBtn = document.getElementById("sendBtn")

const ttsAudio = document.getElementById("ttsAudio")

// 视频
const idleVideo = "idle.mp4"

const listenVideo = "listen.mp4"

const talkVideo = "talk.mp4"

// 豆包API
const API_KEY = "ark-fc480865-2676-46dc-95e5-9a066a244cb4-e5c49"

// 是否正在说话
let isTalking = false

// 切换视频
function switchVideo(src, loop = true) {

  video.pause()

  video.src = src

  video.currentTime = 0

  video.loop = loop

  video.play()
}

// 待机
function setIdle() {

  if (isTalking) return

  statusText.innerText = "当前状态：待机中"

  switchVideo(idleVideo, true)
}

// 倾听
function setListening() {

  isTalking = false

  statusText.innerText = "当前状态：正在倾听..."

  switchVideo(listenVideo, true)
}

// 说话
function setTalking() {

  isTalking = true

  statusText.innerText = "当前状态：小七正在回答"

  switchVideo(talkVideo, true)
}

// TTS播放
async function speakText(text) {

  try {

    setTalking()

    console.log("开始请求TTS")

    const response = await fetch(
      "https://talkto7.onrender.com/tts",
      {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          text: text,
        }),
      }
    )

    const blob = await response.blob()

    const audioUrl = URL.createObjectURL(blob)

    // 停止旧音频
    ttsAudio.pause()

    ttsAudio.currentTime = 0

    // 设置音频
    ttsAudio.src = audioUrl

    // 音频结束
    ttsAudio.onended = () => {

      console.log("播放结束")

      isTalking = false

      setIdle()

      URL.revokeObjectURL(audioUrl)
    }

    // 播放
    await ttsAudio.play()

  } catch (error) {

    console.error(error)

    isTalking = false

    setIdle()
  }
}

// 调用豆包
async function askDoubao(question) {

  try {

    const response = await fetch(
      "http://localhost:3000/chat",
      {

        method: "POST",

        headers: {

          "Content-Type": "application/json"

        },

        body: JSON.stringify({

          question: question

        })

      }

    )

    const data = await response.json()

    return data.answer

  }

  catch (error) {

    console.error(error)

    return "抱歉，我暂时无法回答。"

  }

}

// 处理问题
async function handleQuestion(question) {

  if (!question) return

  replyBox.innerText = "小七思考中..."

  const answer = await askDoubao(question)

  replyBox.innerText = answer

  await speakText(answer)
}

// 文字发送
sendBtn.addEventListener("click", () => {

  const question = textInput.value

  handleQuestion(question)
})

// 语音识别
const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition

if (SpeechRecognition) {

  const recognition = new SpeechRecognition()

  recognition.lang = "zh-CN"

  recognition.interimResults = false

  recognition.continuous = false

  // 点击麦克风
  micBtn.addEventListener("click", () => {

    if (isTalking) return

    setListening()

    recognition.start()
  })

  // 识别结果
  recognition.onresult = async (event) => {

    const transcript =
      event.results[0][0].transcript

    replyBox.innerText =
      `你说：${transcript}`

    await handleQuestion(transcript)
  }

  // 错误
  recognition.onerror = () => {

    if (!isTalking) {

      setIdle()
    }
  }

  // 结束
  recognition.onend = () => {

    console.log("语音识别结束")
  }

} else {

  alert("浏览器不支持语音识别")
}

// 初始化
setIdle()
