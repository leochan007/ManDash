import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import ffmpegPath from 'ffmpeg-static'
import { spawn } from 'child_process'

const assetsDir = path.resolve('assets')
const snapshotDir = path.resolve('snapshot')

const iconSvg = path.join(assetsDir, 'icon.svg')
const iconPng = path.join(snapshotDir, 'icon-128.png')
const introPng = path.join(snapshotDir, 'intro.png')
const promoMp4 = path.join(snapshotDir, 'intro_promo.mp4')

function log(...args) { console.log('[gen-assets]', ...args) }

async function ensureDirs() {
  if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true })
}

async function makeIcon() {
  if (!fs.existsSync(iconSvg)) throw new Error(`Source SVG not found: ${iconSvg}`)
  await sharp(iconSvg)
    .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(iconPng)
  log('Icon generated:', iconPng)
}

async function makeVideo() {
  if (!ffmpegPath) throw new Error('ffmpeg-static not found')
  if (!fs.existsSync(introPng)) throw new Error(`Intro image not found: ${introPng}`)
  const fontCandidates = [
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/segoeuib.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf'
  ]
  const font = fontCandidates.find(f => fs.existsSync(f)) || ''
  const vf = [
    'scale=1280:720',
    'format=yuv420p',
    font ? `drawtext=fontfile=${font}:text='Mantle Dashboard Extension':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h*0.25` : `drawtext=text='Mantle Dashboard Extension':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h*0.25`,
    font ? `drawtext=fontfile=${font}:text='Real-time Gas Price · Market Cap · MNT Price':fontcolor=white:fontsize=30:x=(w-text_w)/2:y=h*0.45` : `drawtext=text='Real-time Gas Price · Market Cap · MNT Price':fontcolor=white:fontsize=30:x=(w-text_w)/2:y=h*0.45`,
    font ? `drawtext=fontfile=${font}:text='TPS · Kline · Multilingual · Light/Dark':fontcolor=white:fontsize=30:x=(w-text_w)/2:y=h*0.57` : `drawtext=text='TPS · Kline · Multilingual · Light/Dark':fontcolor=white:fontsize=30:x=(w-text_w)/2:y=h*0.57`
  ].join(',')
  const args = ['-y', '-loop', '1', '-i', introPng, '-t', '12', '-r', '30', '-vf', vf, promoMp4]
  log('Running ffmpeg:', ffmpegPath, args.join(' '))
  await new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, args, { stdio: 'inherit' })
    p.on('error', reject)
    p.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}`)))
  })
  log('Video generated:', promoMp4)
}

async function main() {
  await ensureDirs()
  await makeIcon()
  await makeVideo()
}

main().catch(err => {
  console.error('[gen-assets] Error:', err)
  process.exit(1)
})

