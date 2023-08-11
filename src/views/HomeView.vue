<template>
  <div>
    <div style="padding: 20px">
      <h1>ASR</h1>
      <button @click="startRecording" :disabled="isRecording">Start Recording</button>
      <button @click="stopRecording" :disabled="!isRecording">Stop Recording</button>
      <audio ref="audioPlayer" controls></audio>
    </div>
    <div style="padding: 20px">
      <h1>TTS</h1>
      <input v-model="text" type="text" placeholder="请输入文字"/>
      <button @click="playMusic">播放音乐</button>
    </div>
  </div>
</template>
<script setup>
import {onMounted, ref} from 'vue'
import axios from 'axios'
import {MediaRecorder, register} from 'extendable-media-recorder'
import {connect} from 'extendable-media-recorder-wav-encoder'

const text = ref('')
const recordedChunks = []
const audioPlayer = ref(null)
const isRecording = ref(false)
let mediaRecorder = null

onMounted(async () => {
  await register(await connect())
  const stream = await navigator.mediaDevices.getUserMedia({audio: true})
  const firstAudioTrack = stream.getAudioTracks()[0]
  firstAudioTrack.getSettings = ((getSettings) => () => {
    const settings = getSettings.call(firstAudioTrack)
    return Object.assign(settings, {channelCount: 1, sampleRate: 16000})
  })(firstAudioTrack.getSettings)
  console.log(firstAudioTrack.getSettings())
  const audioContext = new AudioContext({sampleRate: 16000})
  const mediaStreamAudioSourceNode = new MediaStreamAudioSourceNode(audioContext, {mediaStream: stream});
  const mediaStreamAudioDestinationNode = new MediaStreamAudioDestinationNode(audioContext)
  mediaStreamAudioSourceNode.connect(mediaStreamAudioDestinationNode);
  mediaRecorder = new MediaRecorder(mediaStreamAudioDestinationNode.stream, {mimeType: 'audio/wav'})
})

const startRecording = () => {
  isRecording.value = true
  recordedChunks.length = 0
  mediaRecorder.ondataavailable = event => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data)
    }
  }
  mediaRecorder.start(10)
}

const stopRecording = () => {
  if (isRecording.value) {
    const getSpeechData = () => {
      return new Promise((resolve, reject) => {
        const blob = new Blob(recordedChunks, {type: 'audio/wav'})
        const audioUrl = URL.createObjectURL(blob)
        audioPlayer.value.src = audioUrl
        isRecording.value = false
        const reader = new FileReader()
        reader.onloadend = async () => {
          resolve(reader.result.split(',')[1])
        }
        reader.readAsDataURL(blob)
      })
    }
    const speechToText = async (speechData) => {
      const url = `http://111.39.203.196:8090/paddlespeech/asr`
      const reqBody = {
        "audio": speechData,
        "audio_format": 'wav',
        "sample_rate": 16000,
        "lang": 'zh',
      }
      const resp = await axios.post(url, reqBody)
      console.log(resp.data)
      return resp.data.result.transcription
    }
    const chat = async (message) => {
      const url = `http://10.2.0.215:8000`
      const resp = await axios.post(url, message, {headers: {'Content-Type': 'application/json'}})
      return resp.data
    }
    mediaRecorder.onstop = async event => {
      console.log('onstop', event)
      const speechData = await getSpeechData()
      const question = await speechToText(speechData)
      const message = {prompt: question}
      text.value = (await chat(message)).response
      await playMusic()
    }
    mediaRecorder.stop()
  }
}

const playMusic = async () => {
  const url = `http://111.39.203.196:8090/paddlespeech/tts`
  const reqBody = {
    "text": text.value,
    "spk_id": 0,
    "speed": 1.0,
    "volume": 1.0,
    "sample_rate": 16000,
    "save_path": './test.wav'
  }
  const resp = await axios.post(url, reqBody)
  const audioDataStr = atob(resp.data.result.audio)
  const audioDataArray = new Uint8Array(audioDataStr.length)
  for (let i = 0; i < audioDataStr.length; i++) {
    audioDataArray[i] = audioDataStr.charCodeAt(i)
  }
  const audioDataBlob = new Blob([audioDataArray.buffer], {type: 'audio/wav'})
  const audio = new Audio();
  audio.src = URL.createObjectURL(audioDataBlob)
  await audio.play()
}
</script>