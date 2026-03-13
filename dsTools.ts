/**
 * Microbit for Typescript Tools
 */
//% block="工具模块" color=#276f86 icon="\uf7d9"
//% groups="['string', 'other']"
export namespace DsTools {

    /**
     * lastIndexOf
     */
    //% block="从后找位置|字符串 = %str|要查找字符 = %ele"
    //% str.defl=abcab
    //% ele.defl=a
    export function lastIndexOf(str: string, ele: string) {
        let fromIndex = str.length - 1;
        let l = ele.length
        // 从后向前遍历数组
        for (let i = fromIndex; i >= 0; i--) {
            if (str.slice(i, i + l) === ele) {
                return i;
            }
        }
        // 如果未找到，返回-1
        return -1;
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

    export function spaceStr(value: string) {
        let str = padZeroStart(value, 8, '0')
        return str.split('').join(' ');
    }

    export function padZeroStart(value: string, length: number, ch: string): string {
        return value.padStart(length, ch);
    }

}