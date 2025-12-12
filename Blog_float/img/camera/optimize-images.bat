@echo off
echo 开始优化图片...
echo.

REM 1. 安装必要工具（需要管理员权限）
REM npm install -g sharp
REM 或者下载 ImageMagick: https://imagemagick.org/script/download.php

REM 2. 创建优化目录
if not exist "img/optimized" mkdir "img/optimized"
if not exist "img/optimized/camera" mkdir "img/optimized/camera"
if not exist "img/optimized/camera/风景" mkdir "img/optimized/camera/风景"
if not exist "img/optimized/camera/人像" mkdir "img/optimized/camera/人像"
if not exist "img/optimized/camera/摩托" mkdir "img/optimized/camera/摩托"

REM 3. 使用 ImageMagick 压缩图片
echo 压缩风景图片...
for %%f in (img/camera/风景/*.jpg) do (
    echo 处理: %%~nxf
    magick "%%f" -resize 1200x1200 -quality 75 -strip "img/optimized/camera/风景/%%~nxf"
)

echo 压缩人像图片...
for %%f in (img/camera/人像/*.jpg img/camera/人像/*.png) do (
    echo 处理: %%~nxf
    magick "%%f" -resize 1000x1000 -quality 80 -strip "img/optimized/camera/人像/%%~nxf"
)

echo 压缩机车图片...
for %%f in (img/camera/摩托/*.jpg) do (
    echo 处理: %%~nxf
    magick "%%f" -resize 1200x1200 -quality 75 -strip "img/optimized/camera/摩托/%%~nxf"
)

REM 4. 优化小图片
echo 优化小图片...
magick "img/头像.jpg" -resize 150x150 -quality 85 -strip "img/optimized/avatar.jpg"
magick "img/LOGO.png" -resize 100x100 -quality 95 -strip "img/optimized/logo.png"

echo.
echo 优化完成！
echo 原图大小统计:
dir /s img/camera\*.jpg | find "文件"
echo.
echo 优化后大小统计:
dir /s img/optimized\*.jpg | find "文件"
echo.
echo 请将图片路径改为 img/optimized/...
pause
