# 🍊 Mandarines

**The simplest way to learn Mandarin Chinese.**

Mandarines takes you from zero to HSK 4 through a structured, gamified journey — one topic at a time, with instant feedback on every answer.

---

## Features

**Learn Mode** — every topic follows the same 6-step pattern so you always know what to expect:
1. Read the vocabulary with examples
2. Pinyin drill — type the pronunciation from an English prompt
3. Character recognition — see the character, recall its pinyin
4. Speaking practice *(coming soon)*
5. Writing practice *(coming soon)*
6. Mixed drill — everything combined before you move on

**Recap Mode** — build your own custom drill. Pick any combination of skills and topics, set a question count, and go. Great for reviewing weak spots before an exam.

**Progress tracking** — XP, levels, streaks, and per-step completion per topic. All synced to your account so it follows you across devices.

**55 topics** across 5 stations — Foundation → HSK 1 → HSK 2 → HSK 3 → HSK 4, following the official HSK curriculum.

---

## Tech

- [Next.js](https://nextjs.org) — React framework
- [Supabase](https://supabase.com) — auth + database
- [Tailwind CSS](https://tailwindcss.com) — styling

---

## Character Recognition

**Character Recognition (Writing Exercise)** — The writing step uses a custom-trained Convolutional Neural Network (CNN) for handwriting recognition. The model is a MobileNet-lite architecture (depthwise separable convolutions) with 787 output classes covering HSK 1–6 vocabulary. It was trained entirely from scratch on synthetic data: Chinese characters rendered across three fonts (SimSun, Microsoft YaHei, Microsoft YaHei Bold) with augmentation including elastic distortion, rotation, stroke width variation, and Gaussian noise — 118,050 samples total. Training ran on CPU via PyTorch and the model was exported to ONNX format (2.3 MB) for in-browser inference using `onnxruntime-web`, with no backend calls.
