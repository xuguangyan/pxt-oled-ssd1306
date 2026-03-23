/**
 * Microbit for Typescript Tools
 */
//% block="工具库" color=#276f86 icon="\uf0ad"
//% groups="['string', 'other']"
namespace DsTools {

    /**
     * lastIndexOf
     */
    //% block="从后找位置|字符串 = %str|要查找字符 = %ele"
    //% str.defl=abcab
    //% ele.defl=a
    export function lastIndexOf(str: string, ele: string): number {
        let fromIndex = str.length - 1
        let l = ele.length
        // 从后向前遍历数组
        for (let i = fromIndex; i >= 0; i--) {
            if (str.slice(i, i + l) === ele) {
                return i
            }
        }
        // 如果未找到，返回-1
        return -1
    }

    /**
     * 查找字符串
     */
    export function findStr(pattern1: string, pattern2: string, text: string): string {
        let pos1 = text.indexOf(pattern1)
        if (pos1 >= 0) {
            pos1 += pattern1.length
        }
        const pos2 = lastIndexOf(text, pattern2)
        // console.log(`pos1=${pos1}, pos2=${pos2}`)
        if (pos1 >= 0 && pos2 >= 0 && pos1 < pos2) {
            return text.slice(pos1, pos2)
        }
        return ''
    }

    export function intToBinary(num: number) {
        let binary = ''
        while (num > 0) {
            binary = (num % 2) + binary
            num = Math.floor(num / 2)
        }
        return binary || '0'
    }

    export function intToHex(num: number): string {
        let hex = ''
        const hexChars = '0123456789ABCDEF'
        while (num > 0) {
            hex = hexChars[num % 16] + hex
            num = Math.floor(num / 16)
        }
        return hex || '0'
    }

    /**
     * padStart
     */
    //% block="填充右对齐|字符串 = %str|固定长度 = %len|填充符 = %padStr"
    export function padStart(str: string, len: number, padStr: string): string {
        // 计算需要填充的字符数
        let padLength = len - str.length
        // 如果不需要填充，直接返回原字符串
        if (padLength <= 0) return str
        // 创建填充字符串
        let padding = ''
        for (let i = 0; i < padLength; i++) {
            padding += padStr
        }
        // 返回填充后的字符串
        return padding + str
    }

    export function spaceStr(value: string, width: number = 8): string {
        let str = padZeroStart(value, width, '0')
        return str.split('').join(' ')
    }

    export function padZeroStart(value: string, length: number, ch: string): string {
        return padStart(value, length, ch)
    }

    // Hex转二进制
    export function hexToBinary(hex: string): string {
        // 将十六进制字符串转换为十进制整数
        let decimal = parseInt(hex, 16)
        // 将十进制整数转换为二进制字符串
        let binary = intToBinary(decimal)
        return binary
    }

    // 二进制转Hex
    export function binaryToHex(binary: string): string {
        let retStr = ''
        try {
            let maxLen = Math.ceil(binary.length / 8) * 8
            let s = padStart(binary, maxLen, "0")
            for (let i = 0; i < s.length; i += 8) {
                // extract out in substrings of 4 and convert to hex
                let part = s.slice(i, i + 8)
                let decimal = parseInt(part, 2)
                let hex = intToHex(decimal)
                hex = padStart(hex, 2, '0').toUpperCase()
                retStr += hex

            }
        } catch (e) { }
        return retStr
    }

    /**
     * 旋转二维矩阵（顺时针90度）
     * @param matrix 
     * @returns 
     */
    function rotateMatrix(matrix: Array<Array<string>>): Array<Array<string>> {
        const n = matrix.length
        const rotated: Array<Array<string>> = []

        for (let col = 0; col < n; col++) {
            rotated[col] = []
            for (let row = n - 1; row >= 0; row--) {
                rotated[col][n - 1 - row] = matrix[row][col]
            }
        }
        return rotated
    }


    /**
     * 旋转字体数据（顺时针90度）
     * @param charHexs Hex字符串
     * @returns 
     */
    export function rotateFontData(charHexs: string, width: number = 8): string {
        const matrix = [] // 将rowData转二维数组
        const rate = Math.ceil(width / 8)
        for (let i = 0; i < width; i++) {
            let pos = i * 2 * rate
            let hex = charHexs.slice(pos, pos + 2 * rate)
            let binStr = hexToBinary('0x' + hex)
            binStr = padZeroStart(binStr, width, '0')
            matrix.push(binStr.split(''))
        }
        const rotated = rotateMatrix(matrix)
        let rstHexs = ''
        for (let i = 0; i < rotated.length; i++) {
            let binStr = rotated[i].join('')
            rstHexs += binaryToHex(binStr)
        }
        return rstHexs
    }

    export function isAsciiChar(c: string): boolean {
        // let charIndex = c.charCodeAt(0)
        // return charIndex <= 256
        const font_en = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
        return font_en.includes(c)
    }

}