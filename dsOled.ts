import { DsTools } from './dsTools'
import { DsFonts } from './dsFont'

declare interface Math {
    floor(x: number): number;
}

/**
 * 汉字点阵类型
 */
enum DotType {
    Dot_8x8 = 8,
    Dot_16x16 = 16
}

//% block="OLED屏" color=#27b0ba icon="\uf26c"
namespace DsOLED {
    const SSD1306_SETCONTRAST = 0x81
    const SSD1306_SETCOLUMNADRESS = 0x21
    const SSD1306_SETPAGEADRESS = 0x22
    const SSD1306_DISPLAYALLON_RESUME = 0xA4
    const SSD1306_DISPLAYALLON = 0xA5
    const SSD1306_NORMALDISPLAY = 0xA6
    const SSD1306_INVERTDISPLAY = 0xA7
    const SSD1306_DISPLAYOFF = 0xAE
    const SSD1306_DISPLAYON = 0xAF
    const SSD1306_SETDISPLAYOFFSET = 0xD3
    const SSD1306_SETCOMPINS = 0xDA
    const SSD1306_SETVCOMDETECT = 0xDB
    const SSD1306_SETDISPLAYCLOCKDIV = 0xD5
    const SSD1306_SETPRECHARGE = 0xD9
    const SSD1306_SETMULTIPLEX = 0xA8
    const SSD1306_SETLOWCOLUMN = 0x00
    const SSD1306_SETHIGHCOLUMN = 0x10
    const SSD1306_SETSTARTLINE = 0x40
    const SSD1306_MEMORYMODE = 0x20
    const SSD1306_COMSCANINC = 0xC0
    const SSD1306_COMSCANDEC = 0xC8
    const SSD1306_SEGREMAP = 0xA0
    const SSD1306_CHARGEPUMP = 0x8D
    const chipAdress = 0x3C
    const xOffset = 0
    const yOffset = 0
    let charX = 0
    let charY = 0
    let displayWidth = 128
    let displayHeight = 64 / 8
    let screenSize = 0
    let loadStarted: boolean;
    let loadPercent: number;
    let dotType = DotType.Dot_16x16

    let font16: string[] = []
    let font16_matrix: string[] = []

    let font8: string[] = []
    let font8_matrix: string[] = []

    //% block="添加字符 $chr|点阵数据 $hex|到16x16字库"
    //% chr.defl=""
    //% hex.defl="64个hex字符"
    //% blockExternalInputs=true
    //% advanced=true
    export function addCustomChr16(chr: string, hex: string) {
        if (chr != null && chr.length == 1 && hex != null && hex.length > 0) {
            // add new character
            font16.push(chr)
            font16_matrix.push(hex)
        }
    }

    //% block="添加字符 $chr|点阵数据 $hex|到8x8字库"
    //% chr.defl=""
    //% hex.defl="16个hex字符"
    //% blockExternalInputs=true
    //% advanced=true
    export function addCustomChr8(chr: string, hex: string) {
        if (chr != null && chr.length == 1 && hex != null && hex.length > 0) {
            // add new character
            font8.push(chr)
            font8_matrix.push(hex)
        }
    }

    function command(cmd: number) {
        let buf = pins.createBuffer(2)
        buf[0] = 0x00
        buf[1] = cmd
        pins.i2cWriteBuffer(chipAdress, buf, false)
    }
    //% block="清除显示"
    //% weight=3
    export function clear() {
        loadStarted = false
        loadPercent = 0
        command(SSD1306_SETCOLUMNADRESS)
        command(0x00)
        command(displayWidth - 1)
        command(SSD1306_SETPAGEADRESS)
        command(0x00)
        command(displayHeight - 1)
        let data = pins.createBuffer(17);
        data[0] = 0x40; // Data Mode
        for (let i = 1; i < 17; i++) {
            data[i] = 0x00
        }
        // send display buffer in 16 byte chunks
        for (let i = 0; i < screenSize; i += 16) {
            pins.i2cWriteBuffer(chipAdress, data, false)
        }
        charX = xOffset
        charY = yOffset
    }

    function drawLoadingFrame() {
        command(SSD1306_SETCOLUMNADRESS)
        command(0x00)
        command(displayWidth - 1)
        command(SSD1306_SETPAGEADRESS)
        command(0x00)
        command(displayHeight - 1)
        let col = 0
        let page = 0
        let data = pins.createBuffer(17);
        data[0] = 0x40; // Data Mode
        let i = 1
        for (let page = 0; page < displayHeight; page++) {
            for (let col = 0; col < displayWidth; col++) {
                if (page === 3 && col > 12 && col < displayWidth - 12) {
                    data[i] = 0x60
                } else if (page === 5 && col > 12 && col < displayWidth - 12) {
                    data[i] = 0x06
                } else if (page === 4 && (col === 12 || col === 13 || col === displayWidth - 12 || col === displayWidth - 13)) {
                    data[i] = 0xFF
                } else {
                    data[i] = 0x00
                }
                if (i === 16) {
                    pins.i2cWriteBuffer(chipAdress, data, false)
                    i = 1
                } else {
                    i++
                }

            }
        }
        charX = 30
        charY = 2
        writeString("Loading:")
    }
    function drawLoadingBar(percent: number) {
        charX = 78
        charY = 2
        let num = Math.floor(percent)
        writeNum(num)
        writeString("%")
        let width = displayWidth - 14 - 13
        let lastStart = width * (loadPercent / displayWidth)
        command(SSD1306_SETCOLUMNADRESS)
        command(14 + lastStart)
        command(displayWidth - 13)
        command(SSD1306_SETPAGEADRESS)
        command(4)
        command(5)
        let data = pins.createBuffer(2);
        data[0] = 0x40; // Data Mode
        data[1] = 0x7E
        for (let i = lastStart; i < width * (Math.floor(percent) / 100); i++) {
            pins.i2cWriteBuffer(chipAdress, data, false)
        }
        loadPercent = num
    }

    //% block="显示进度条 $percent %"
    //% percent.min=0 percent.max=100
    //% weight=2
    export function drawLoading(percent: number) {
        if (loadStarted) {
            drawLoadingBar(percent)
        } else {
            drawLoadingFrame()
            drawLoadingBar(percent)
            loadStarted = true
        }
    }


    //% block="显示字符串 $str"
    //% weight=6
    export function writeString(str: string) {
        for (let i = 0; i < str.length; i++) {
            if (charX > displayWidth - 8) {
                newLine()
            }
            let fontWidth = drawFont(charX, charY, str.charAt(i))
            charX += fontWidth
        }
    }
    //% block="显示数字 $n"
    //% weight=5
    export function writeNum(n: number) {
        let numString = n.toString()
        writeString(numString)
    }
    //% block="新行显示字符串 $str"
    //% weight=8
    export function writeStringNewLine(str: string) {
        writeString(str)
        newLine()
    }
    //% block="新行显示数字 $n"
    //% weight=7
    export function writeNumNewLine(n: number) {
        writeNum(n)
        newLine()
    }
    //% block="新行"
    //% weight=4
    export function newLine() {
        let fontLines = 1 // 字体行高（占page数）
        if (dotType == DotType.Dot_16x16) {
            fontLines = 2 // 16点阵占2行
        }
        charY += fontLines
        charX = xOffset
    }

    /**
     * 绘制文字(中英文混排)
     * @param x 横坐标
     * @param y 纵坐标
     * @param c 文字
     */
    function drawFont(x: number, y: number, c: string): number {
        let fontWidth = 6
        // if (DsTools.isAsciiChar(c)) {
        if (isAsciiChar(c)) {
            drawChar(x, y, c)
        } else {
            if (dotType == DotType.Dot_16x16) {
                drawCn16(x, y, c, 1)
                fontWidth = 16
            } else {
                drawCn(x, y, c, 1)
                fontWidth = 8
            }

        }
        return fontWidth
    }

    function isAsciiChar(c: string): boolean {
        // return !DsFonts.font_cn.includes(c)
        return DsFonts.font_en.includes(c)
    }

    /**
     * 绘制字符
     * @param x 横坐标
     * @param y 纵坐标
     * @param c accii码字符
     */
    function drawChar(x: number, y: number, c: string) {
        command(SSD1306_SETCOLUMNADRESS)
        command(x)
        command(x + 5)
        command(SSD1306_SETPAGEADRESS)
        command(y)
        command(y + 1)
        let charIndex = c.charCodeAt(0)
        let pos = 5 * charIndex * 2
        let charHexs = DsFonts.font_en_hex.slice(pos, pos + 10)
        if (charHexs.length < 10) {
            charHexs = DsTools.padZeroStart(charHexs, 10, 'F')
        }
        // console.log(c, charIndex, charHexs || 'NaN')

        let line = pins.createBuffer(2)
        line[0] = 0x40
        for (let i = 0; i < 6; i++) {
            if (i === 5) {
                line[1] = 0x00
                // console.log(DsTools.spaceStr('0'), '0x00')
            } else {
                let pos = i * 2
                let hex = charHexs.slice(pos, pos + 2)
                let decimal = parseInt('0x' + hex, 16)
                line[1] = decimal
                const binary = DsTools.intToBinary(decimal)
                // console.log(DsTools.spaceStr(binary), '0x' + hex)
            }
            pins.i2cWriteBuffer(chipAdress, line, false)
        }
    }

    /**
     * 绘制中文（8x8点阵）
     * @param x 横坐标
     * @param y 纵坐标
     * @param c 中文字
     * @param rotate  旋转次数（顺时针90度）
     */
    function drawCn(x: number, y: number, c: string, rotate = 0) {
        command(SSD1306_SETCOLUMNADRESS)
        command(x)
        command(x + 8)
        command(SSD1306_SETPAGEADRESS)
        command(y)
        command(y + 1)

        let charHexs = ''
        let charIndex = font8.indexOf(c)
        if (charIndex >= 0) {
            charHexs = font8_matrix[charIndex]
        } else {
            charIndex = DsFonts.font_cn.indexOf(c)
            let pos = 8 * charIndex * 2
            charHexs = DsFonts.font_cn_hex8.slice(pos, pos + 16)
        }

        if (charHexs.length < 16) {
            charHexs = DsTools.padZeroStart(charHexs, 16, 'F')
        }
        // console.log(charIndex, charHexs || 'NaN')

        // 旋转次数
        for (let i = 0; i < rotate % 4; i++) {
            charHexs = DsTools.rotateFontData(charHexs)
        }
        // console.log(charIndex, charHexs || 'NaN')

        let line = pins.createBuffer(2)
        line[0] = 0x40
        for (let i = 0; i < 8; i++) {
            let pos = i * 2
            let hex = charHexs.slice(pos, pos + 2)
            let decimal = parseInt('0x' + hex, 16)
            line[1] = decimal
            const binary = DsTools.intToBinary(decimal)
            // console.log(DsTools.spaceStr(binary), '0x' + hex)

            pins.i2cWriteBuffer(chipAdress, line, false)
        }
    }

    /**
     * 绘制中文（16x16点阵）
     * @param x 横坐标
     * @param y 纵坐标
     * @param c 中文字
     * @param rotate  旋转次数（顺时针90度）
     */
    function drawCn16(x: number, y: number, c: string, rotate = 0) {
        command(SSD1306_SETCOLUMNADRESS)
        command(x)
        command(x + 16)
        command(SSD1306_SETPAGEADRESS)
        command(y)
        command(y + 2)

        let charHexs = ''
        let charIndex = font16.indexOf(c)
        if (charIndex >= 0) {
            charHexs = font16_matrix[charIndex]
        } else {
            charIndex = DsFonts.font_cn.indexOf(c)
            let pos = 16 * charIndex * 4
            charHexs = DsFonts.font_cn_hex16.slice(pos, pos + 64)
        }

        if (charHexs.length < 64) {
            charHexs = DsTools.padZeroStart(charHexs, 64, 'F')
        }
        // console.log(charIndex, charHexs || 'NaN')

        // 旋转次数
        for (let i = 0; i < rotate % 4; i++) {
            charHexs = DsTools.rotateFontData(charHexs, 16)
        }
        // console.log(charIndex, charHexs || 'NaN')

        let line = pins.createBuffer(2)
        line[0] = 0x40
        for (let i = 0; i < 16; i++) {
            let pos = i * 4
            let hex2 = charHexs.slice(pos + 2, pos + 4)
            let decimal2 = parseInt('0x' + hex2, 16)
            line[1] = decimal2

            pins.i2cWriteBuffer(chipAdress, line, false)
        }
        for (let i = 0; i < 16; i++) {
            let pos = i * 4
            let hex1 = charHexs.slice(pos, pos + 2)
            let decimal1 = parseInt('0x' + hex1, 16)
            line[1] = decimal1

            pins.i2cWriteBuffer(chipAdress, line, false)
        }
    }

    function drawShape(pixels: Array<Array<number>>) {
        let x1 = displayWidth
        let y1 = displayHeight * 8
        let x2 = 0
        let y2 = 0
        for (let i = 0; i < pixels.length; i++) {
            if (pixels[i][0] < x1) {
                x1 = pixels[i][0]
            }
            if (pixels[i][0] > x2) {
                x2 = pixels[i][0]
            }
            if (pixels[i][1] < y1) {
                y1 = pixels[i][1]
            }
            if (pixels[i][1] > y2) {
                y2 = pixels[i][1]
            }
        }
        let page1 = Math.floor(y1 / 8)
        let page2 = Math.floor(y2 / 8)
        let line = pins.createBuffer(2)
        line[0] = 0x40
        for (let x = x1; x <= x2; x++) {
            for (let page = page1; page <= page2; page++) {
                line[1] = 0x00
                for (let i = 0; i < pixels.length; i++) {
                    if (pixels[i][0] === x) {
                        if (Math.floor(pixels[i][1] / 8) === page) {
                            line[1] |= Math.pow(2, (pixels[i][1] % 8))
                        }
                    }
                }
                if (line[1] !== 0x00) {
                    command(SSD1306_SETCOLUMNADRESS)
                    command(x)
                    command(x + 1)
                    command(SSD1306_SETPAGEADRESS)
                    command(page)
                    command(page + 1)
                    //line[1] |= pins.i2cReadBuffer(chipAdress, 2)[1]
                    pins.i2cWriteBuffer(chipAdress, line, false)
                }
            }
        }
    }

    //% block="画线条 起点:|x: $x0 y: $y0 终点| x: $x1 y: $y1"
    //% x0.defl=0
    //% y0.defl=0
    //% x1.defl=20
    //% y1.defl=20
    //% weight=1
    export function drawLine(x0: number, y0: number, x1: number, y1: number) {
        let pixels: Array<Array<number>> = []
        let kx: number, ky: number, c: number, i: number, xx: number, yy: number, dx: number, dy: number;
        let targetX = x1
        let targetY = y1
        x1 -= x0; kx = 0; if (x1 > 0) kx = +1; if (x1 < 0) { kx = -1; x1 = -x1; } x1++;
        y1 -= y0; ky = 0; if (y1 > 0) ky = +1; if (y1 < 0) { ky = -1; y1 = -y1; } y1++;
        if (x1 >= y1) {
            c = x1
            for (i = 0; i < x1; i++, x0 += kx) {
                pixels.push([x0, y0])
                c -= y1; if (c <= 0) { if (i != x1 - 1) pixels.push([x0 + kx, y0]); c += x1; y0 += ky; if (i != x1 - 1) pixels.push([x0, y0]); }
                if (pixels.length > 20) {
                    drawShape(pixels)
                    pixels = []
                    drawLine(x0, y0, targetX, targetY)
                    return
                }
            }
        } else {
            c = y1
            for (i = 0; i < y1; i++, y0 += ky) {
                pixels.push([x0, y0])
                c -= x1; if (c <= 0) { if (i != y1 - 1) pixels.push([x0, y0 + ky]); c += y1; x0 += kx; if (i != y1 - 1) pixels.push([x0, y0]); }
                if (pixels.length > 20) {
                    drawShape(pixels)
                    pixels = []
                    drawLine(x0, y0, targetX, targetY)
                    return
                }
            }
        }
        drawShape(pixels)
    }

    //% block="绘制矩形 起点:|x: $x0 y: $y0 终点| x: $x1 y: $y1"
    //% x0.defl=0
    //% y0.defl=0
    //% x1.defl=20
    //% y1.defl=20
    //% weight=0
    export function drawRectangle(x0: number, y0: number, x1: number, y1: number) {
        drawLine(x0, y0, x1, y0)
        drawLine(x0, y1, x1, y1)
        drawLine(x0, y0, x0, y1)
        drawLine(x1, y0, x1, y1)
    }
    //% block="绘制圆形 起点:|x: $x y: $y 半径| $r"
    //% x.defl=64
    //% y.defl=32
    //% r.defl=10
    //% weight=0
    export function drawCircle(x: number, y: number, r: number) {
        let theta = 0;
        let step = Math.PI / 90;  // Adjust step for smoothness
        let pixels: Array<Array<number>> = [];

        while (theta < 2 * Math.PI) {
            let xPos = Math.floor(x + r * Math.cos(theta));
            let yPos = Math.floor(y + r * Math.sin(theta));
            pixels.push([xPos, yPos]);
            theta += step;
        }

        drawShape(pixels);
    }

    //% block="绘制实心圆形 起点:|x: $x y: $y 半径| $r"
    //% x.defl=64
    //% y.defl=32
    //% r.defl=10
    //% weight=0
    export function drawFilledCircle(x: number, y: number, r: number) {
        for (let dx = -r; dx <= r; dx++) {
            let height = Math.floor(Math.sqrt(r * r - dx * dx));
            drawLine(x + dx, y - height, x + dx, y + height);
        }
    }
    //% block="OLED 初始化 宽 %width 高 %height 字体 %type"
    //% width.defl=128
    //% height.defl=64
    //% weight=9
    export function init(width: number, height: number, type: DotType) {
        command(SSD1306_DISPLAYOFF);
        command(SSD1306_SETDISPLAYCLOCKDIV);
        command(0x80);                                  // the suggested ratio 0x80
        command(SSD1306_SETMULTIPLEX);
        command(0x3F);
        command(SSD1306_SETDISPLAYOFFSET);
        command(0x0);                                   // no offset
        command(SSD1306_SETSTARTLINE | 0x0);            // line #0
        command(SSD1306_CHARGEPUMP);
        command(0x14);
        command(SSD1306_MEMORYMODE);
        command(0x00);                                  // 0x0 act like ks0108
        command(SSD1306_SEGREMAP | 0x1);
        command(SSD1306_COMSCANDEC);
        command(SSD1306_SETCOMPINS);
        command(0x12);
        command(SSD1306_SETCONTRAST);
        command(0xCF);
        command(SSD1306_SETPRECHARGE);
        command(0xF1);
        command(SSD1306_SETVCOMDETECT);
        command(0x40);
        command(SSD1306_DISPLAYALLON_RESUME);
        command(SSD1306_NORMALDISPLAY);
        command(SSD1306_DISPLAYON);
        displayWidth = width
        displayHeight = height / 8
        screenSize = displayWidth * displayHeight
        charX = xOffset
        charY = yOffset
        loadStarted = false
        loadPercent = 0
        dotType = type
        clear()
    }
}
