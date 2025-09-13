const http = require('http')

const payload = JSON.stringify({
  items: [{ name: 'Test Item', unit_amount: 500, quantity: 1, currency: 'usd' }],
  successUrl: 'http://localhost:8080/checkout-success?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: 'http://localhost:8080/cart',
  customerEmail: 'smoke_run@example.com'
})

const opts = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/stripe/checkout',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}

const req = http.request(opts, (res) => {
  let body = ''
  res.setEncoding('utf8')
  res.on('data', (chunk) => body += chunk)
  res.on('end', () => {
    console.log('STATUS', res.statusCode)
    try { console.log(JSON.parse(body)) } catch (e) { console.log(body) }
  })
})

req.on('error', (err) => { console.error('REQ ERROR', err) })
req.write(payload)
req.end()
