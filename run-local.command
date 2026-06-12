#!/bin/zsh
set -e

cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "未找到 npm。请先安装 Node.js LTS: https://nodejs.org/"
  echo "安装完成后重新运行这个脚本。"
  exit 1
fi

echo "正在检查并同步依赖..."
npm install

echo "正在启动本地开发服务器..."
npm run dev
