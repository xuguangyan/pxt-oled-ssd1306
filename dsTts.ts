import { DsTools } from './dsTools'
import { DsCharset } from './dsCharset'

/**
 * 编码类型
 */
enum CharsetType {
    GB2312 = 0,
    UTF_8 = 4
}

//% block="语音合成" color=#ffd43b icon="\uf028"
namespace DsTTS {
    let writeLog: (msg: string) => void

    function logResponse(msg: string, sendType = true) {
        if (writeLog) {
            let msgType = sendType ? '>:' : '<:'
            let msgTxt = sendType ? msg : msg.slice(0, 30)
            writeLog(msgType + msgTxt)
        }
    }

    /**
     * On Message Log
     * @param handler Connect callback
     */
    //% blockId=on_tts_msg_log block="监听tts日志"
    //% weight=94
    export function on_tts_msg_log(
        handler: (msg: string) => void,
    ): void {
        writeLog = handler
    }

    //% block="初始化合成|RX %tx|TX %rx|Baud rate %baudrate"
    //% tx.defl=SerialPin.P12
    //% rx.defl=SerialPin.P13
    //% baudrate.defl=BaudRate.BaudRate9600
    //% weight=99
    export function initTTS(
        tx: SerialPin,
        rx: SerialPin,
        baudrate: BaudRate
    ) {
        serial.redirect(tx, rx, baudrate)
    }

    function isAsciiChar(c: string): boolean {
        return !DsCharset.char_cn.includes(c)
    }

    function findCharset(c: string): number {
        // return !DsCharset.char_cn.includes(c)
        for (let i = 0; i < DsCharset.char_cn.length; i++) {
            if (DsCharset.char_cn.charAt(i) == c) {
                return i
            }
        }
        return -1
    }

    function send_data(hex: string, type: CharsetType) {
        const lenHex = DsTools.padStart(DsTools.intToHex(hex.length / 2 + 2), 4, '0')
        const typeHex = DsTools.padStart(DsTools.intToHex(type), 2, '0')
        const cmd = '01'
        const cmdHex = "FD" + lenHex + cmd + typeHex + hex
        serial.writeBuffer(Buffer.fromHex(cmdHex))
        logResponse(cmdHex)
    }

    //% block="合成语音 文字 %str 编码类型 %type"
    //% type.defl=CharsetType.GB2312
    //% weight=25
    export function cmd_play(str: string, type: CharsetType) {
        let strHex = ""
        for (let i = 0; i < str.length; i++) {
            let c = str.charAt(i)
            let code = c.charCodeAt(0)
            let charHexs = DsTools.padStart(DsTools.intToHex(code), 2, '0')
            strHex += charHexs
        }
        send_data(strHex, type)
    }

    //% block="本地合成 文字 %str"
    //% weight=20
    export function cmd_play_local(str: string) {
        let strHex = ""
        for (let i = 0; i < str.length; i++) {
            let c = str.charAt(i)
            let charIndex = findCharset(c)
            // if (isAsciiChar(c)) {
            if (charIndex < 0) {
                let code = c.charCodeAt(0)
                let charHexs = DsTools.padStart(DsTools.intToHex(code), 2, '0')
                strHex += charHexs
            } else {
                // let charIndex = DsCharset.char_cn.indexOf(c)
                let pos = charIndex * 4
                let charHexs = DsCharset.char_cn_gb2312.slice(pos, pos + 4)
                if (charHexs.length < 4) {
                    charHexs = DsTools.padZeroStart(charHexs, 4, '0')
                }
                strHex += charHexs
            }
        }
        send_data(strHex, CharsetType.GB2312)
    }

    //% block="停止合成"
    //% weight=18
    export function cmd_stop() {
        serial.writeBuffer(Buffer.fromHex("FD000102"))
    }


    //% block="暂停合成"
    //% weight=16
    export function cmd_pause() {
        // 查询芯片状态
        // 指令：FD 00 01 21 返回：【0x4E】表示忙状态；【0x4F】表示空闲状态；
        serial.writeBuffer(Buffer.fromHex("FD000103"))
    }


    //% block="恢复合成"
    //% weight=14
    export function cmd_resume() {
        serial.writeBuffer(Buffer.fromHex("FD000104"))
    }

    //% block="查询状态"
    //% weight=12
    export function cmd_query_state() {
        serial.writeBuffer(Buffer.fromHex("FD000121"))
    }

    //% block="音量调节[0-9] 数值 %level"
    //% level.defl=5
    //% weight=10
    export function cmd_vol_set(level: number = 5) {
        level = level > 9 ? 9 : (level < 0 ? 0 : level)
        let levelHex = '3' + level
        serial.writeBuffer(Buffer.fromHex("FD000601015B76" + levelHex + "5D"))
    }

    //% block="语速调节[0-9] 数值 %level"
    //% level.defl=5
    //% weight=8
    export function cmd_speed_set(level: number = 5) {
        level = level > 9 ? 9 : (level < 0 ? 0 : level)
        let levelHex = '3' + level
        serial.writeBuffer(Buffer.fromHex("FD000601015B73" + levelHex + "5D"))
    }

    //% block="语调调节[0-9] 数值 %level"
    //% level.defl=5
    //% weight=6
    export function cmd_tone_set(level: number = 5) {
        level = level > 9 ? 9 : (level < 0 ? 0 : level)
        let levelHex = '3' + level
        serial.writeBuffer(Buffer.fromHex("FD000601015B74" + levelHex + "5D"))
    }

    //% block="提示音[1-5] 数值 %level"
    //% level.defl=1
    //% weight=4
    export function play_sound_msg(level: number = 1) {
        level = level > 5 ? 5 : (level < 1 ? 1 : level)
        let levelHex = '3' + level
        serial.writeBuffer(Buffer.fromHex("FD000B01016D6573736167655F" + levelHex))
    }

    //% block="警示音[1-5] 数值 %level"
    //% level.defl=1
    //% weight=2
    export function play_sound_alert(level: number = 1) {
        level = level > 5 ? 5 : (level < 1 ? 1 : level)
        let levelHex = '3' + level
        serial.writeBuffer(Buffer.fromHex("FD00090101616C6572745F" + levelHex))
    }

    //% block="铃声[1-5] 数值 %level"
    //% level.defl=1
    //% weight=0
    export function play_sound_ring(level: number = 1) {
        level = level > 5 ? 5 : (level < 1 ? 1 : level)
        let levelHex = '3' + level
        serial.writeBuffer(Buffer.fromHex("FD0008010172696E675F" + levelHex))
    }
}