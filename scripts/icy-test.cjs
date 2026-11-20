const https = require('node:https')
const http = require('node:http')

const urls = [
  'https://ice1.somafm.com/groovesalad-128-mp3',
  'https://stream.radioparadise.com/mp3-192',
  'https://stream.nightride.fm/nightride.mp3',
  'https://icecast.radiofrance.fr/fip-midfi.mp3'
]

function readTitle(url, redirects = 0) {
  return new Promise((resolve) => {
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    let parsed
    try {
      parsed = new URL(url)
    } catch {
      return finish(null)
    }
    const transport = parsed.protocol === 'https:' ? https : http
    const request = transport.get(
      parsed,
      {
        headers: {
          'Icy-MetaData': '1',
          'User-Agent': 'SmoothRadio/1.0 (Windows; desktop radio client)',
          Accept: '*/*',
          Connection: 'close'
        },
        timeout: 9000
      },
      (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location && redirects < 5) {
          response.resume()
          response.destroy()
          readTitle(new URL(response.headers.location, parsed).toString(), redirects + 1).then(finish)
          return
        }
        const metaInt = Number(response.headers['icy-metaint'])
        if (!metaInt) {
          response.destroy()
          return finish(null)
        }
        let buffer = Buffer.alloc(0)
        response.on('data', (chunk) => {
          buffer = Buffer.concat([buffer, chunk])
          let offset = metaInt
          while (buffer.length >= offset + 1) {
            const length = buffer[offset] * 16
            if (buffer.length < offset + 1 + length) break
            if (length > 0) {
              const block = buffer.subarray(offset + 1, offset + 1 + length).toString('utf8')
              const match = /StreamTitle=(['"])([\s\S]*?)\1\s*;/.exec(block)
              if (match?.[2]?.trim()) {
                response.destroy()
                return finish(match[2].trim())
              }
            }
            offset += 1 + length + metaInt
          }
          if (buffer.length > 160000) {
            response.destroy()
            finish(null)
          }
        })
        response.on('end', () => finish(null))
        response.on('error', () => finish(null))
      }
    )
    request.on('timeout', () => {
      request.destroy()
      finish(null)
    })
    request.on('error', () => finish(null))
  })
}

for (const url of urls) {
  readTitle(url).then((title) => console.log(`${title ? 'OK ' : '-- '} ${url} -> ${title}`))
}
