# FluxFlow · 第十七轮：视频入口占位按钮

## 本轮修改
仅在 Paper and resources 的 Download PDF / Cite this work 同一操作行加入一个紧凑的 **Video · Coming soon** 按钮，配有装饰性播放图标。
视频地址尚未提供：按钮为原生 `disabled` 状态，无虚构 YouTube 地址、空 href、跳转或点击处理。状态文字直接可见，未依赖鼠标提示；保留可读对比度，不以整体透明处理。未来收到视频链接后再改为真实视频入口。

## 保留内容与基线
基于已部署 V16 提交 `5ef67ddd8d168157fa37260095fa876991b6b175`。
原有六个论文资源/操作链接不变。已有视频占位区域不移除。封面、居中 Abstract、Hubble 全幅背景、全球图、科学数据、比较器、V16 下拉样式、V15 360px 论文预览及 V14 全部动效保持不变。

## 检查与边界
网页差异仅为新增按钮 HTML、样式缓存版本和 `assets/css/page-layout.css` 末尾按钮专用规则；另更新本说明。没有改动 JavaScript 或图片，无新增依赖。
检查原有 HTML 在去除新增按钮与缓存版本后完全一致、全部资源路径有效、其余 106 个静态文件逐字节不变。独立静态审计覆盖禁用语义、可见状态、窄屏换行与强制色。
私密预览需要所有者登录，**未声称已完成浏览器视觉验收**。

## 使用
完整静态网页：根目录含 `index.html` 和 `assets/`。可执行 `python -m http.server 8000`，打开 `http://localhost:8000/`。
原所有者私密预览：https://fluxflow-clean-layout-preview.cleargrove22.chatgpt.site 。是否已更新以交付部署结果为准。
未修改原 GitHub Pages：https://i2wm.github.io/fluxflow/ 。自行部署前请备份发布目录，不要覆盖训练工程。论文来源、版本和许可保持原样。
