const http = require('http')
const sessionId = process.argv[2]
if (!sessionId) { console.error('session_id required'); process.exit(1) }
const url = '/api/stripe/verify?session_id=' + encodeURIComponent(sessionId)
const opts = { hostname: 'localhost', port: 3000, path: url, method: 'GET' }
const req = http.request(opts, (res) => {
  let body = ''
  res.setEncoding('utf8')
  res.on('data', (c) => body += c)
  res.on('end', () => {
    console.log('STATUS', res.statusCode)
    try { console.log(JSON.parse(body)) } catch (e) { console.log(body) }
  })
})
req.on('error', (e) => console.error('REQ ERROR', e))
req.end()
