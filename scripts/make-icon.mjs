import pngToIco from 'png-to-ico'
import { writeFileSync } from 'fs'

const buf = await pngToIco('build/icon-square.png')
writeFileSync('build/icon.ico', buf)
console.log('build/icon.ico created')
