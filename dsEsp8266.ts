/**
 * Microbit for ESP8266 Wifi modules
 */
//% block="wifi模块" color=#009b5b icon="\uf1eb"
namespace DsEsp8266 {
  type SrvResult = {
    success: boolean
    msg: string
    data: string
  }

  type EvtAct = (res: SrvResult) => void

  let wifiCallback: (success: boolean, msg: string, data: string) => void
  let conCallback: (success: boolean, msg: string, data: string) => void
  let reqCallback: (success: boolean, msg: string, data: string) => void
  let writeLog: (msg: string) => void
  let wifi_connected: boolean = false

  function sendAT(msg: string) {
    serial.writeString(msg)
    // wait(100)
  }

  function receiveAT() {
    return serial.readString()
  }

  function logResponse(msg: string, sendType = true) {
    if (writeLog) {
      let msgType = sendType ? '>:' : '<:'
      let msgTxt = sendType ? msg : msg.slice(0, 30)
      writeLog(msgType + msgTxt)
    }
  }

  function send_cmd(cmd: string, timeout = 3000, ack: string = null, newline = true): boolean {
    const ln = newline ? "\r\n" : ""
    const msg = cmd + ln
    logResponse(msg)
    sendAT(msg)

    let serial_str = recieve_data(timeout)
    if (ack == null) {
      ack = 'OK'
    }
    if (!ack || serial_str.includes(ack)) {
      return true
    }
    return false
  }

  function send_data(msg: string, timeout = 3000): string {
    msg += "\r\n"
    logResponse(msg)
    sendAT(msg)

    let serial_str = recieve_data(timeout)
    return serial_str
  }

  function recieve_data(timeout: number) {
    let serial_str = ''
    let time: number = input.runningTime()
    while (true) {
      const str = receiveAT()
      if (str.length > 0) {
        serial_str += str
      }
      // wait(100)
      if (input.runningTime() - time > timeout) break
    }
    if (serial_str.length > 0) {
      logResponse(serial_str, false)
    }
    return serial_str
  }

  function wifiResponse(rst: SrvResult, msg: string) {
    rst.msg = msg
    if (wifiCallback) {
      wifiCallback(rst.success, rst.msg, rst.data)
    }
  }

  function parseIPAddr(data: string) {
    //格式：\r\nOK\r\n\r\n+CWJAP:1,'ChinaNet-XU',192.168.1.116\r\n
    let wifi_IP = data
    if (data) {
      try {
        let pos = DsTools.lastIndexOf(data, ',')
        if (pos >= 0) {
          wifi_IP = data.slice(pos + 1).replace('\r\n', '')
        }
      } catch (e) { }
    }
    return wifi_IP
  }

  /**
   * Initialize Wifi
   */
  //% block="初始化wifi|RX %tx|TX %rx|Baud rate %baudrate"
  //% tx.defl=SerialPin.P13
  //% rx.defl=SerialPin.P12
  //% weight=100
  export function initWifi(
    tx: SerialPin,
    rx: SerialPin,
    baudrate: BaudRate
  ) {
    serial.redirect(tx, rx, baudrate)
  }

  /**
   * Connect Wifi
   */
  //% block="连接wifi|Wifi SSID = %ssid|Wifi PWD = %pwd"
  //% ssid.defl=ChinaNet-XU
  //% pwd.defl=13710637730
  //% weight=99
  export function connectWifi(
    ssid: string,
    pwd: string,
  ) {
    wifi_connected = false
    let rst: SrvResult = { success: false, msg: '', data: '' }
    let ok = send_cmd("+++", 1000, '', false)
    if (!ok) { wifiResponse(rst, '透传退出失败'); return; }
    ok = send_cmd("AT+RESTORE")
    if (!ok) { wifiResponse(rst, '恢复设置失败'); return; }
    // ok = send_cmd("AT")
    // if (!ok) { wifiResponse(rst, 'AT测试失败'); return; }
    ok = send_cmd("AT+CWMODE=0", 1000); // 【注意】DX_WF24设置：STA=0,AP=1,STA+AP=2；ESP8266设置：STA=1,AP=2,STA+AP=3
    if (!ok) { wifiResponse(rst, 'STA模式失败'); return; }
    let data = send_data("AT+CWJAP=" + ssid + "," + pwd, 10000)
    if (!data.includes('OK')) { wifiResponse(rst, 'wifi连接失败'); return; }

    // 查询wifi IP地址
    // let data = send_data("AT+CIPSTA?")
    let wifi_IP = parseIPAddr(data)
    rst = { success: false, msg: '', data: '' }
    if (wifi_IP) {
      wifi_connected = true
      rst.success = true
      rst.data = wifi_IP
      wifiResponse(rst, 'wifi连接成功')
    } else {
      rst.msg = '获取IP失败'
      wifiResponse(rst, '获取IP失败')
    }
  }

  function conResponse(rst: SrvResult, msg: string) {
    rst.msg = msg
    if (conCallback) {
      conCallback(rst.success, rst.msg, rst.data)
    }
  }

  function tcpSend(
    ip: string,
    port: string,
    action: string,
    params: string,
    method: string = 'TCP',
  ) {
    let rst: SrvResult = { success: false, msg: '', data: '' }
    if (!wifi_connected) {
      conResponse(rst, 'wifi未连接'); return '';
    }
    if (!action) {
      conResponse(rst, 'action为空'); return '';
    }
    let ok = send_cmd("AT+CIPMODE=1", 1000)
    if (!ok) { conResponse(rst, '透传设置失败'); return ''; }
    ok = send_cmd("AT+CIPSTART=TCP," + ip + "," + port, 5000)
    if (!ok) { conResponse(rst, '连接服务器失败'); return ''; }
    rst.success = true
    conResponse(rst, '连接服务器成功')

    let data = ''
    if (method == 'GET') {
      data = `GET /${action}?${params} HTTP/1.1\r\n`
    } else if (method == 'POST') {
      data = `POST /${action}?${params}\r\n`
    } else {
      data = `{"action":"${action}"}`
    }
    ok = send_cmd("AT+CIPSEND", 1000)
    rst = { success: false, msg: '', data: '' }
    if (!ok) { conResponse(rst, '透传开启失败'); return ''; }
    rst.success = true
    let responseTxt = send_data(data) // upload data
    // 处理响应数据
    let realData = responseTxt
    if (responseTxt) {
      if ('GET|POST'.includes(method)) {
        realData = DsTools.findStr('\r\n\r\n', '\r\n', responseTxt)
      }
    }
    if (reqCallback) {
      if (realData) {
        reqCallback(true, '响应成功', realData)
      } else {
        reqCallback(false, '响应失败', responseTxt)
      }
    }
    return realData
  }

  /**
   * get request
   */
  //% block="GET请求|URL/IP = %ip|port = %port|action = %action|params = %params"
  //% ip.defl=192.168.1.199
  //% port.defl=2999
  //% action.defl=noticeText
  //% weight=31
  export function getRequest(
    ip: string,
    port: string,
    action: string,
    params: string,
  ) {
    return tcpSend(ip, port, action, params, 'GET')
  }

  /**
   * get request
   */
  //% block="GET请求|URL/IP = %ip|port = %port|action = %action|params = %params"
  //% ip.defl=192.168.1.199
  //% port.defl=2999
  //% action.defl=noticeText
  //% weight=30
  export function get_request(
    ip: string,
    port: string,
    action: string,
    params: string,
  ) {
    getRequest(ip, port, action, params)
  }

  /**
 * tcp request
 */
  //% block="TCP请求|IP = %ip|port = %port|action = %action|params = %params"
  //% ip.defl=192.168.1.199
  //% port.defl=2888
  //% action.defl=noticeText
  //% weight=21
  export function tcpRequest(
    ip: string,
    port: string,
    action: string,
    params: string,
  ) {
    return tcpSend(ip, port, action, params, 'TCP')
  }
  /**
   * tcp request
   */
  //% block="TCP请求|IP = %ip|port = %port|action = %action|params = %params"
  //% ip.defl=192.168.1.199
  //% port.defl=2888
  //% action.defl=noticeText
  //% weight=20
  export function tcp_request(
    ip: string,
    port: string,
    action: string,
    params: string,
  ) {
    tcpRequest(ip, port, action, params)
  }

  /**
   * On Wifi Change
   * @param handler Wifi callback
   */
  //% blockId=on_wifi_Change block="当Wifi改变时"
  //% weight=18
  export function on_wifi_Change(
    handler: (success: boolean, msg: string, data: string) => void,
  ): void {
    wifiCallback = handler
  }

  /**
   * On Connect Callback
   * @param handler Connect callback
   */
  //% blockId=on_con_Callback block="当连接返回"
  //% weight=16
  export function on_con_Callback(
    handler: (success: boolean, msg: string, data: string) => void,
  ): void {
    conCallback = handler
  }

  /**
   * On Request Callback
   * @param handler request callback
   */
  //% blockId=on_req_callback block="当请求返回"
  //% weight=14
  export function on_req_callback(
    handler: (success: boolean, msg: string, data: string) => void,
  ): void {
    reqCallback = handler
  }

  /**
   * On Message Log
   * @param handler Connect callback
   */
  //% blockId=on_wifi_msg_log block="监听wifi日志"
  //% weight=12
  export function on_wifi_msg_log(
    handler: (msg: string) => void,
  ): void {
    writeLog = handler
  }

  /**
   * Wait between uploads
   */
  //% block="等待 %delay ms"
  //% delay.min=0 delay.defl=5000
  //% weight=10
  export function wait(delay: number) {
    if (delay > 0) basic.pause(delay)
  }

}
