import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const svgPath = fileURLToPath(new URL('../build/icon.svg', import.meta.url))
const icoPath = fileURLToPath(new URL('../build/icon.ico', import.meta.url))
const pngPath = fileURLToPath(new URL('../build/icon.png', import.meta.url))

const svg = await readFile(svgPath)

const sizes = [16, 24, 32, 48, 64, 128, 256]
const pngs = await Promise.all(
  sizes.map((size) => sharp(svg, { density: 300 }).resize(size, size).png().toBuffer())
)

await writeFile(icoPath, await pngToIco(pngs))
await sharp(svg, { density: 300 }).resize(512, 512).png().toFile(pngPath)

console.log('icon.ico + icon.png generated')
