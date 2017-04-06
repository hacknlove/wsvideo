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

WsFile.prototype.createReadStream = function (opts) {
  var self = this
  var socket
  opts = opts || {}
  opts.start = opts.start || 0
  opts.end = opts.end || ''
  var rs = new EventEmitter()
  rs.pipe = function (writable) {
    socket = new WebSocket(self.path + '?start=' + opts.start + '&end=' + opts.end)
    socket.addEventListener('open', function () {
      socket.addEventListener('message', function (data) {
        blobToBuffer(data.data, function (err, buffer) {
          if (err) return console.log(err)
          var drain = writable.write(buffer)
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
    console.log('destroy')
    socket.close()
  }
  return rs
}

var wsvideo = function (path, element) {
  videostream(new WsFile(path), element)
}

window.wsvideo = wsvideo
