# 数独时光 · 网页游戏

手机和电脑浏览器均可游玩。纯 HTML/CSS/JavaScript，无第三方依赖、无需后端或微信 AppID。

## 本地体验

下载并解压仓库，直接用浏览器打开 `index.html`。也可以运行 `python3 -m http.server 8000` 后访问 `http://localhost:8000`。

## 发布到 GitHub Pages

打开仓库 **Settings → Pages**，Source 选择 **Deploy from a branch**，选择 **master** 和 **/(root)**，点击 Save。部署完成后用 Pages 提供的网址访问和分享。

## 玩法

选空格后点击数字或按 1–9；方向键移动，Delete/Backspace 擦除，N 切换笔记。支持三档难度、随机唯一解题目、计时、错误标记、撤销、提示和本地自动保存。切换标签页时计时暂停。

难度按挖空数量区分，不代表严格的人类技巧分级。提示不限次数，撤销不回退错误次数。进度保存在当前浏览器和网站地址下，不跨设备同步。禁用存储时仍可玩，但无法恢复进度。

## 验证

运行 `node --test tests/*.test.js` 检查生成算法。浏览器交互测试使用 Python Playwright，运行 `python3 tests/browser_test.py`（需先安装 Playwright 和 Chromium）。
