/* global
  WebSocket
*/

const EventEmitter = require('events')
var blobToBuffer = require('blob-to-buffer')
var videostream = require('videostream')

var WsFile = function (path) {
  var self = this
  self.path = path
}

WsFile.prototype.destroy = function () {
  this.writable && this.writable.end()
}

WsFile.prototype.createReadStream = function (opts) {
  var self = this
  var socket
  opts = opts || {}
  opts.start = opts.start || 0
  var rs = new EventEmitter()
  rs.pipe = function (writable) {
    self.writable = writable
    socket = new WebSocket(self.path + '?start=' + opts.start)
    socket.addEventListener('open', function () {
      socket.addEventListener('message', function (data) {
        blobToBuffer(data.data, function (err, buffer) {
          if (err) return console.log(err)
          try {
            var drain = writable.write(buffer)
          } catch (e) {
            console.log(e)
          }
          if (drain === false) {
            socket.send('wait')
          }
        })
      })
      socket.addEventListener('close', function () {
        rs.emit('close')
        rs.emit('end')
        writable.end()
      })
    })
    writable.on('drain', function () {
      socket.send('continue')
    })
  }
  rs.destroy = function () {
    socket.close()
  }
  return rs
}

var wsvideo = function (path, element) {
  var rs = new WsFile(path)
  videostream(rs, element)
  return rs
}

window.wsvideo = wsvideo
