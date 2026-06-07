import { createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  
  ctx.fillStyle = '#3b82f6'
  ctx.fillRect(0, 0, size, size)
  
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${size * 0.55}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('K', size / 2, size / 2)
  
  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync(outputPath, buffer)
  console.log(`Generated: ${outputPath}`)
}

const publicDir = path.join(__dirname, 'public')

generateIcon(192, path.join(publicDir, 'icon-192.png'))
generateIcon(512, path.join(publicDir, 'icon-512.png'))

console.log('PWA icons generated successfully!')
