let a = ['。', '：', '，', '；', '？', '！', ',', ':', '.', '?', ';', '!']
let reg = ''
for (let i in a) {
    let t = a[i].charCodeAt(0)
    if (t < 128) {
        reg += a[i] + ' '
    } else {
        reg += `\\u${a[i].charCodeAt(0).toString(16)} `
    }
}
reg = `[${reg}]+`
console.log(reg)
let txt = '小明是一个小孩，他最喜欢吃肉了。老师说：“你不能吃太多肉”，小明说：“好的”。'
let ts = txt.split(new RegExp(reg))
ts.forEach(t => {
    console.log(t)
})
