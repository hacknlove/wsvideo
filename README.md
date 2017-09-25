# wsvideo
websocket streaming html5 video

`npm install --save wsvideo`

`bower install --save wsvideo`

## Howto client-side
```
var video = document.querySelector('video')

wsvideo('ws://example.com/foo', video)

```

## Howto server-side (node example)

```
const WebSocket = require('ws')
const url = require('url')
...

var streamVideo = function (ws, path, query) {
  var paused = false
  var options = {}
  if (query.start !== undefined) {
    options.start = query.start * 1
  }
  if (query.end * 1) {
    options.end = query.end * 1
  }

  ///
  var stream = CREATE_SOME_READ_STREAM_OF_THE_VIDEO_path_BETWEEN_options.start_AND_options.edn
  ///

  ws.on('close', function () {
    stream.destroy()
  })
  stream.on('data', function (chunk) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk)
    }
    stream.pause()
    // WE WANT TO SEND NOT TOO FAST
    setTimeout(function () {
      if (!paused) {
        stream.resume()
      }
    }, 100)
  })
  ws.on('message', function (data) {
    if (data === 'wait') {
      paused = true
      stream.pause()
      return
    }
    if (data === 'continue') {
      paused = false
      return stream.resume()
    }
  })
  stream.on('end', function () {
    ws.close()
  })
}


websocketserver.on('connection', function connection (ws) {
  const location = url.parse(ws.upgradeReq.url, true)
  return streamVideo(ws, location.pathname, location.query)
})

```

## TODO

Upload a server side
