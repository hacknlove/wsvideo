var EventEmitter = require('events')
var Videostream = require('videostream')
var websocket = require('websocket-stream')

var WsFile = function (path) {
  var self = this
  self.path = path
}

WsFile.prototype.createReadStream = function (opts) {
  opts = opts || {}
  opts.start = opts.start || 0
  var self = this
  self.socket = websocket(self.path + '?start=' + opts.start)

  return self.socket
}

var wsvideo = function (path, element) {
  var file = new WsFile(path)
  Videostream(file, element)
  return function () {
    file.createReadStream = function () {
      var rs = new EventEmitter()
      rs.pipe = function (writable) {
        rs.emit('end')
      }
      return rs
    }
    file.socket.destroy()
  }
}

window.wsvideo = wsvideo
