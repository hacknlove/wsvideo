/* global
  WebSocket
*/

const EventEmitter = require('events')
var blobToBuffer = require('blob-to-buffer')
var Videostream = require('videostream')

var WsFile = function (path) {
  var self = this
  self.path = path
}

WsFile.prototype.createReadStream = function (opts) {
  opts = opts || {}
  opts.start = opts.start || 0
  var self = this
  var socket = new WebSocket(self.path + '?start=' + opts.start)
  self.socket = socket
  var rs = new EventEmitter()
  var writables = []

  var send = function (data, from) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(data)
    }
  }
  window.send = send

  var onOpen = function () {
    if (writables.length) {
      send('continue')
    }
    socket.addEventListener('close', onClose)
  }

  var onMessage = function (data) {
    blobToBuffer(data.data, function (err, buffer) {
      if (err) return console.log(err)
      writables.forEach(function (w) {
        w.write(buffer) || send('wait')
      })
    })
  }
  var onClose = function () {
    writableOnClose()

    socket.removeEventListener('close', onClose)
    socket.removeEventListener('open', onOpen)
    rs.emit('close')
    rs.emit('end')
    writables.forEach(function (w) {
      w.end()
    })
  }

  var writableOnDrain = function () {
    send('continue')
  }
  var writableOnClose = function (e) {
    socket.removeEventListener('message', onMessage)
    writables.forEach(function (w) {
      w.removeListener('drain', writableOnDrain)
      w.removeListener('close', writableOnClose)
    })
    send('wait')
    writables = []
  }

  rs.pipe = function (w) {
    writables.push(w)
    w.on('drain', writableOnDrain)
    w.on('close', writableOnClose)
    socket.addEventListener('message', onMessage)
    send('continue')
  }
  rs.destroy = function () {
    socket.close()
  }

  socket.addEventListener('open', onOpen)

  return rs
}

var wsvideo = function (path, element) {
  var file = new WsFile(path)
  Videostream(file, element)
  return function () {
    file.socket.close()
  }
}

window.wsvideo = wsvideo
