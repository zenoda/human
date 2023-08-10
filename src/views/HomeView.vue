<template>
    <div>
        <input v-model="text" type="text" placeholder="请输入文字"/>
        <button @click="playMusic">播放音乐</button>
    </div>
</template>

<script>
import {ref} from 'vue'
import axios from 'axios'

export default {
    name: 'HomeView',
    setup() {
        const text = ref('');

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
        };

        return {
            text,
            playMusic,
        };
    }
};
</script>