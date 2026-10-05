独立只读复核 · 2026-10-06

按 video-shotcraft 的 final-review / aesthetic-rules 执行本次限定检查。基准为用户已确认选版、最新署名要求及 selection.json、author-reference.json；Ziteng 的新要求优先于旧本地论文的 1,2。

**阻断项：无（仅本次范围）。**

**通过项：**

- P4 ✓ 01首页B、02视频B、03方法B、04结果A、05对比B、06数据B、07资源B。七区 HTML 初始类与 refinement.js:2–5 的固定集合一致；未发现 URL、存储或交互切换选版的逻辑，6B1A 固定生效。
- D1 ✓ 首屏、团队和手机截图均为 Ziteng Cui¹（仅东京大学）、Quanfeng Xu³*（上海天文台、共同一作）；单位 1/3 与星号说明对应正确。证据：site/index.html:57、58、464、478、479；rendered-v2/home-review.jpg、team-review.jpg、mobile-current.png。
- F1 ✓ 首屏与团队区分别计得 12 个不重复姓名、5 个单位；BibTeX 同为 12 位作者，包含 Xu, Quanfeng（site/index.html:250）。
- P4 ✓ 04 结果区源 HTML 与 paths.json 的 target/index.html 完全一致：均为 4,055 字节，SHA-256 均为 9ee7c956ab1e6e0f9d21ecb7826839e00685a07701e029fdff17b895ff581aaa。
- Q ✓ 已目视上述三张截图：姓名、上标、五单位及共同一作说明均无明显裁切；团队截图包含完整 12 人署名。

**范围限制：**仅核对指定源码与现有截图；未另起浏览器重渲染。结果区“一致”指源 HTML；refinement.js 仍插入隐藏的 B 版辅助节点，由 .refine-only 隐藏，不代表运行时 DOM 逐节点相同。其余四段复用素材、音轨及完整帧数按分工不重复复核；最终 64 秒抽帧待提供后补验，本报告不作为整片终检结论。未改代码或素材，仅写本报告。

最终64秒补验：通过。已目视最终成片在 64.000 秒的实际抽帧 final-review/64.000.jpg，并非仅 HTML 预览。团队主画面及右侧手机画面中，Ziteng Cui 上标仅为 1（东京大学），未残留旧上标 1,2；Quanfeng Xu 上标为 3*（上海天文台、共同一作），署名无明显裁切。本项无阻断，前述 64 秒待补验项已完成；本轮未扩展其他审计。
