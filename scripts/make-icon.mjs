import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const resources = path.join(root, 'resources')
const build = path.join(root, 'build')

await fs.mkdir(resources, { recursive: true })
await fs.mkdir(build, { recursive: true })

const iconSvg = path.join(resources, 'icon.svg')
const traySvg = path.join(resources, 'tray.svg')

// App icon (window + installer)
await sharp(iconSvg).resize(1024, 1024).png().toFile(path.join(resources, 'icon.png'))
await sharp(iconSvg).resize(512, 512).png().toFile(path.join(build, 'icon.png'))
await sharp(iconSvg).resize(512, 512).png().toFile(path.join(resources, 'discord-logo.png'))

// Multi-size ICO for Windows
const icoSizes = [16, 24, 32, 48, 64, 128, 256]
const icoFiles = []
for (const size of icoSizes) {
  const file = path.join(build, `icon-${size}.png`)
  await sharp(iconSvg).resize(size, size).png().toFile(file)
  icoFiles.push(file)
}
const ico = await pngToIco(icoFiles)
await fs.writeFile(path.join(build, 'icon.ico'), ico)

// Tray icon
await sharp(traySvg).resize(32, 32).png().toFile(path.join(resources, 'tray.png'))
await sharp(traySvg).resize(32, 32).png().toFile(path.join(build, 'tray.png'))

console.log('Icons generated:')
console.log(' - resources/icon.png (1024)')
console.log(' - resources/tray.png (32)')
console.log(' - resources/discord-logo.png (512)')
console.log(' - build/icon.ico (multi-size)')
console.log(' - build/icon.png (512)')
