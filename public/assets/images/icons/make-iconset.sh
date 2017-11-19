#!/bin/bash
cd "$(dirname "$0")"

mkdir Khepri.iconset
rsvg-convert -h 1024 Khepri-macos.svg > Khepri-macos.png
sips -z 16 16     Khepri-macos.png --out Khepri.iconset/icon_16x16.png
sips -z 32 32     Khepri-macos.png --out Khepri.iconset/icon_16x16@2x.png
sips -z 32 32     Khepri-macos.png --out Khepri.iconset/icon_32x32.png
sips -z 64 64     Khepri-macos.png --out Khepri.iconset/icon_32x32@2x.png
sips -z 128 128   Khepri-macos.png --out Khepri.iconset/icon_128x128.png
sips -z 256 256   Khepri-macos.png --out Khepri.iconset/icon_128x128@2x.png
sips -z 256 256   Khepri-macos.png --out Khepri.iconset/icon_256x256.png
sips -z 512 512   Khepri-macos.png --out Khepri.iconset/icon_256x256@2x.png
sips -z 512 512   Khepri-macos.png --out Khepri.iconset/icon_512x512.png
mv Khepri-macos.png Khepri.iconset/icon_512x512@2x.png
iconutil -c icns Khepri.iconset
rm -R Khepri.iconset
