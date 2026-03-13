import { DsTools } from './dsTools'
import { DsFonts } from './dsFont'

// 命令行：ts-node testx.ts
const char = '你'
console.log(char.charCodeAt(0))

function drawChar(c: string) {
    let charIndex = c.charCodeAt(0)
    let pos = 5 * charIndex * 2
    let charHexs = DsFonts.font_en_hex.slice(pos, pos + 10)
    if (charHexs.length < 10) {
        charHexs = DsTools.padZeroStart(charHexs, 10, 'F')
    }
    console.log(c, charIndex, charHexs || 'NaN')
    let line = new Array(2)
    line[0] = 0x40
    for (let i = 0; i < 6; i++) {
        if (i === 5) {
            line[1] = 0x00
            console.log(DsTools.spaceStr('0'), '0x00')
        } else {
            let pos = i * 2
            let hex = charHexs.slice(pos, pos + 2)
            let decimal = parseInt('0x' + hex, 16)
            line[1] = decimal
            const binary = decimal.toString(2)
            console.log(DsTools.spaceStr(binary), '0x' + hex)
        }
        // console.log(line)
    }
}

function drawCn(c: string) {
    let charIndex = DsFonts.font_cn.indexOf(c)
    let pos = 8 * charIndex * 2
    let charHexs = DsFonts.font_cn_hex.slice(pos, pos + 16)
    if (charHexs.length < 16) {
        charHexs = DsTools.padZeroStart(charHexs, 16, 'F')
    }
    console.log(charIndex, charHexs || 'NaN')
    let line = new Array(2)
    line[0] = 0x40
    for (let i = 0; i < 8; i++) {
        let pos = i * 2
        let hex = charHexs.slice(pos, pos + 2)
        let decimal = parseInt('0x' + hex, 16)
        line[1] = decimal
        const binary = decimal.toString(2)
        console.log(DsTools.spaceStr(binary), '0x' + hex)
        // console.log(line)
    }
}

drawChar('1')
// drawChar('你')

// drawCn('a')
drawCn('你')