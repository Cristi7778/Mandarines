#!/usr/bin/env python3
"""
Train a Chinese character recognizer for the Mandarines app.

Generates synthetic training data (characters rendered in system fonts +
handwriting-style augmentation), trains a lightweight MobileNet-style CNN,
and exports to ONNX for use with onnxruntime-web in the browser.

Requirements:
    pip install torch torchvision pillow onnx numpy

Run from the repo root:
    python scripts/train_recognizer.py

Optional — extract current app chars first (always included anyway):
    node scripts/extract-chars.js

Outputs:
    public/models/recognizer.onnx    (loaded by onnxruntime-web)
    public/models/classes.json       (index → Unicode character)
"""

import json, os, random, sys, time
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# ─── Hyper-parameters ─────────────────────────────────────────────────────────
SIZE             = 64     # must match toNorm() in char-recognition.ts
SAMPLES_PER_CLS  = 150   # augmented renders per character
BATCH            = 128
EPOCHS           = 35
LR               = 1e-3

# ─── Character set ────────────────────────────────────────────────────────────
# Broad supplement: covers HSK 1-6 vocab and common everyday Chinese so the
# model stays useful as the app grows without retraining.  Deduplicated with
# whatever extract-chars.js found in the current app data.
_SUPPLEMENT = (
    # Pronouns / basic
    "我你他她它咱您我们你们他们它们咱们"
    # Numbers
    "零一二三四五六七八九十百千万亿两"
    # Common verbs
    "是有去来做说听看吃喝买卖写读学习认识想要帮找等待开始结束"
    "喜欢知道叫住感谢介绍告诉回答问解决使用提供完成收到发送"
    "表示注意记忘放进出走跑跳唱飞游洗穿戴换拿给带领借还付请"
    "爱恨怕笑哭打开关停起坐站躺睡醒休息工作玩旅游参观"
    "选择决定同意反对建议希望相信感觉认为觉得了解需要允许"
    "比较增加减少改变发展提高降低保护支持反映回来进去出来"
    "见面联系检查治疗准备计划安排通知帮助服务教育培训"
    # People / family
    "人男女老小孩子父母亲爸妈哥姐弟妹儿女兄弟丈夫妻子"
    "朋友同学老师学生医生护士工人农民司机商人经理职员"
    "邻居客户顾客观众听众读者作者记者演员运动员"
    # Body
    "头脸眼耳鼻嘴牙舌手臂腿脚背腹心肺胃脑皮肤血"
    # Food / drink
    "米饭面包饺子包子馒头饼菜肉鱼鸡鸭猪牛羊蛋奶"
    "汤粥茶水酒咖啡啤果汁可乐蔬菜水果盐糖油醋"
    "苹果香蕉橙梨葡萄西瓜草莓菠萝芒果番茄黄瓜"
    "土豆白菜萝卜豆腐花生核桃饼干糖果巧克力蛋糕"
    # Transport
    "车船飞机公路铁路地铁公共汽车火车自行车摩托"
    "出租车高铁轮船渡船出行交通道路街道"
    # Places
    "家学校医院银行商店超市公园图书馆餐厅酒店"
    "机场车站邮局博物馆电影院剧场体育馆游泳池"
    "宾馆旅馆厕所卫生间办公室工厂农场"
    "城市农村乡村村庄县市省国家世界"
    "中国美国英国法国德国日本韩国俄罗斯"
    "北京上海广州深圳香港台湾"
    # Time
    "年月日天时分秒今昨明后前早晚上下午中夜半"
    "现在以前以后刚就已经还没曾经将来以后"
    "星期周一二三四五六日春夏秋冬季节"
    "早上早晨上午中午下午晚上夜里深夜"
    "去年今年明年上个月这个月下个月"
    "小时半天整天整夜一会儿片刻"
    # Colors
    "红橙黄绿蓝紫黑白灰粉棕金银"
    # Adjectives
    "好坏大小多少高低长短新旧快慢热冷难容易漂亮"
    "贵便宜重轻干净脏安全危险健康生病累精神"
    "美丽聪明笨懒勤努力认真负责有趣无聊"
    "重要必要普通特别正常奇怪严重简单复杂"
    "有名著名流行传统现代古老新鲜"
    "满意高兴开心伤心难过生气愤怒"
    "紧张放松自信担心害怕惊讶"
    # Measure words
    "个本张条只杯件双些种次回位份套间座层块"
    "瓶罐袋箱碗盘盒把根支棵颗粒段节篇章"
    # Grammar / function words
    "的地得了着过把被从在到以于向对为与和或"
    "但是不过然而虽然尽管即使只要如果因为所以"
    "而且并且也又还另外除了除非关于根据"
    "一些每个所有很非常特别真的确实其实"
    "这那里这里那里哪里什么谁哪怎么为什么"
    "多少几何时候怎样如何"
    # Common nouns (objects)
    "书桌椅子床门窗墙地板天花板"
    "电视电脑手机相机电话收音机"
    "网络上网照片视频音乐电影"
    "钱钞票硬币价格收入工资费用"
    "衣服裤子鞋帽子袜子领带围巾手套"
    "包手提包钱包行李箱雨伞"
    "纸笔墨水本子文件报告资料"
    "药片药水注射针治疗手术"
    "问题答案方法结果原因目的"
    "计划方案决定条件规定标准"
    "消息新闻信息通知广告"
    "语言文字词句段落文章"
    "历史文化艺术科学技术"
    "经济政治社会环境"
    "天气温度气候风雨雪云太阳月亮星星"
    "山河湖海洋岛森林草原沙漠"
    "动物植物花草树叶"
    "狗猫鸟鱼虫马羊"
    # HSK 4-6 common additions
    "分析研究调查了解掌握发现发明创造"
    "表达描述解释说明证明强调"
    "管理领导负责监督检查评价"
    "参加参与组织举办安排策划"
    "合作交流沟通联系配合"
    "影响作用效果意义价值"
    "能力水平程度经验技能"
    "机会条件环境基础资源"
    "发展变化进步改善提高"
    "成功失败胜利失败结果"
    "努力坚持坚定勇敢谦虚"
    "责任义务权利自由"
    "社会经济文化政治"
    "传统习惯风俗文化"
    "态度方式方法途径"
    "感情情感情绪心情"
    "印象观点看法意见"
    "比较差别区别相同不同"
    "各种多种不同各自"
    "当然必须应该可以能够"
    "总是经常偶尔有时从不"
    "越来越更加非常十分相当"
)

def _build_charset() -> list[str]:
    seen: set[str] = set()
    chars: list[str] = []

    def add(ch: str):
        if ch not in seen:
            seen.add(ch)
            chars.append(ch)

    for ch in _SUPPLEMENT:
        if '\u4e00' <= ch <= '\u9fff' or '\u3400' <= ch <= '\u4dbf':
            add(ch)

    # Union with whatever extract-chars.js produced for the current app
    chars_json = os.path.join(os.path.dirname(__file__), 'chars.json')
    if os.path.exists(chars_json):
        with open(chars_json, encoding='utf-8') as f:
            for ch in json.load(f):
                add(ch)

    return chars

# ─── Font discovery ───────────────────────────────────────────────────────────
def find_fonts() -> list[str]:
    candidates = [
        # Windows
        r"C:\Windows\Fonts\simsun.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\simkai.ttf",
        r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\msyhbd.ttc",
        r"C:\Windows\Fonts\STKAITI.TTF",
        r"C:\Windows\Fonts\STHEITI.TTF",
        r"C:\Windows\Fonts\STFANGSO.TTF",
        r"C:\Windows\Fonts\STXINGKA.TTF",
        r"C:\Windows\Fonts\STXIHEI.TTF",
        # macOS
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/PingFang.ttc",
        # Linux / Noto
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJKsc-Regular.otf",
        "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
    ]
    found = [f for f in candidates if os.path.exists(f)]
    if not found:
        print("ERROR: No CJK-capable fonts found on this system.")
        print("Install Noto Sans CJK (https://fonts.google.com/noto/specimen/Noto+Sans+SC)")
        sys.exit(1)
    return found

# ─── Image generation ─────────────────────────────────────────────────────────
def _render_raw(char: str, font_path: str, font_size: int) -> np.ndarray:
    """Render char at 128×128, white background, return greyscale uint8 array."""
    W = 128
    img = Image.new('L', (W, W), 255)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype(font_path, font_size)
    except Exception:
        return np.full((W, W), 255, dtype=np.uint8)
    bb = draw.textbbox((0, 0), char, font=font)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    x = (W - w) // 2 - bb[0]
    y = (W - h) // 2 - bb[1]
    draw.text((x, y), char, fill=0, font=font)
    return np.array(img, dtype=np.uint8)


def _elastic_distort(arr: np.ndarray, alpha: float = 10.0, sigma: float = 4.0) -> np.ndarray:
    """Elastic deformation — simulates natural stroke variation."""
    H, W = arr.shape
    dx = (np.random.rand(H, W) * 2 - 1)
    dy = (np.random.rand(H, W) * 2 - 1)
    # Smooth displacement fields via a tiny PIL blur
    dx_img = Image.fromarray(((dx + 1) * 127.5).astype(np.uint8))
    dy_img = Image.fromarray(((dy + 1) * 127.5).astype(np.uint8))
    dx_img = dx_img.filter(ImageFilter.GaussianBlur(radius=sigma))
    dy_img = dy_img.filter(ImageFilter.GaussianBlur(radius=sigma))
    dx = (np.array(dx_img, dtype=np.float32) / 127.5 - 1.0) * alpha
    dy = (np.array(dy_img, dtype=np.float32) / 127.5 - 1.0) * alpha

    xs, ys = np.meshgrid(np.arange(W), np.arange(H))
    map_x = np.clip(xs + dx, 0, W - 1 - 1e-6)
    map_y = np.clip(ys + dy, 0, H - 1 - 1e-6)

    x0 = map_x.astype(np.int32); x1 = x0 + 1
    y0 = map_y.astype(np.int32); y1 = y0 + 1
    fx = map_x - x0; fy = map_y - y0

    out = (arr[y0, x0] * (1 - fx) * (1 - fy) +
           arr[y0, x1] * fx       * (1 - fy) +
           arr[y1, x0] * (1 - fx) * fy       +
           arr[y1, x1] * fx       * fy)
    return np.clip(out, 0, 255).astype(np.uint8)


def _morph_stroke(arr: np.ndarray, op: str) -> np.ndarray:
    """Dilate or erode by 1px — varies apparent stroke width."""
    img = Image.fromarray(arr)
    if op == 'dilate':
        img = img.filter(ImageFilter.MinFilter(3))   # dark expands → thicker stroke
    else:
        img = img.filter(ImageFilter.MaxFilter(3))   # dark shrinks → thinner
    return np.array(img, dtype=np.uint8)


def _crop_and_resize(arr: np.ndarray) -> np.ndarray | None:
    """Crop to content bounding box + 4px padding, resize to SIZE×SIZE."""
    mask = arr < 200
    if not mask.any():
        return None  # blank render — font doesn't support this char
    rows = np.where(mask.any(axis=1))[0]
    cols = np.where(mask.any(axis=0))[0]
    r0, r1 = rows[0], rows[-1]
    c0, c1 = cols[0], cols[-1]
    pad = 4
    r0 = max(0, r0 - pad); r1 = min(arr.shape[0] - 1, r1 + pad)
    c0 = max(0, c0 - pad); c1 = min(arr.shape[1] - 1, c1 + pad)
    cropped = Image.fromarray(arr[r0:r1+1, c0:c1+1])
    return np.array(cropped.resize((SIZE, SIZE), Image.LANCZOS), dtype=np.uint8)


def generate_sample(char: str, fonts: list[str]) -> np.ndarray | None:
    """Generate one augmented SIZE×SIZE sample. Returns None if char unsupported."""
    font_path = random.choice(fonts)
    font_size = random.randint(56, 80)
    raw = _render_raw(char, font_path, font_size)

    # Rotation
    angle = random.uniform(-15, 15)
    raw_img = Image.fromarray(raw).rotate(angle, fillcolor=255, resample=Image.BICUBIC)
    raw = np.array(raw_img, dtype=np.uint8)

    # Elastic distortion (60% of samples)
    if random.random() < 0.6:
        alpha = random.uniform(6, 14)
        sigma = random.uniform(3, 5)
        raw = _elastic_distort(raw, alpha, sigma)

    # Stroke width variation
    r = random.random()
    if r < 0.3:
        raw = _morph_stroke(raw, 'dilate')
    elif r < 0.5:
        raw = _morph_stroke(raw, 'erode')

    # Gaussian noise (40%)
    if random.random() < 0.4:
        noise = np.random.normal(0, 10, raw.shape)
        raw = np.clip(raw.astype(np.float32) + noise, 0, 255).astype(np.uint8)

    resized = _crop_and_resize(raw)
    return resized


# ─── Dataset ──────────────────────────────────────────────────────────────────
class CharDataset(Dataset):
    def __init__(self, chars: list[str], fonts: list[str]):
        self.items: list[tuple[np.ndarray, int]] = []
        skipped = []

        t0 = time.time()
        for idx, char in enumerate(chars):
            samples = []
            attempts = 0
            while len(samples) < SAMPLES_PER_CLS and attempts < SAMPLES_PER_CLS * 4:
                s = generate_sample(char, fonts)
                if s is not None:
                    samples.append(s)
                attempts += 1

            if len(samples) < 5:
                skipped.append(char)
                continue

            for arr in samples:
                self.items.append((arr, idx))

            if (idx + 1) % 50 == 0 or idx + 1 == len(chars):
                elapsed = time.time() - t0
                pct = (idx + 1) / len(chars)
                eta = elapsed / pct * (1 - pct) if pct > 0 else 0
                print(f"  {idx+1}/{len(chars)} chars  {elapsed:.0f}s elapsed  ETA {eta:.0f}s", end='\r')

        print()
        if skipped:
            print(f"  Skipped {len(skipped)} chars not supported by installed fonts: "
                  f"{''.join(skipped[:20])}{'...' if len(skipped) > 20 else ''}")

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx: int):
        arr, label = self.items[idx]
        # Normalise to 0=white → 0.0, 0=black → 1.0 (matches toNorm in char-recognition.ts)
        x = torch.tensor(1.0 - arr.astype(np.float32) / 255.0, dtype=torch.float32).unsqueeze(0)
        return x, label


# ─── Model ────────────────────────────────────────────────────────────────────
class _DWBlock(nn.Module):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.dw = nn.Conv2d(in_ch, in_ch, 3, padding=1, groups=in_ch, bias=False)
        self.pw = nn.Conv2d(in_ch, out_ch, 1, bias=False)
        self.bn = nn.BatchNorm2d(out_ch)

    def forward(self, x):
        return torch.relu(self.bn(self.pw(self.dw(x))))


class CharCNN(nn.Module):
    def __init__(self, num_classes: int):
        super().__init__()
        self.stem = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),       # → 32×32
        )
        self.blocks = nn.Sequential(
            _DWBlock(32,  64),  nn.MaxPool2d(2),  # → 16×16
            _DWBlock(64,  128), nn.MaxPool2d(2),  # → 8×8
            _DWBlock(128, 256), nn.MaxPool2d(2),  # → 4×4
            _DWBlock(256, 512),                   # → 4×4
        )
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.drop = nn.Dropout(0.4)
        self.fc   = nn.Linear(512, num_classes)

    def forward(self, x):
        x = self.stem(x)
        x = self.blocks(x)
        x = self.pool(x).flatten(1)
        x = self.drop(x)
        return self.fc(x)


# ─── Train ────────────────────────────────────────────────────────────────────
def train():
    chars  = _build_charset()
    fonts  = find_fonts()

    print(f"Character set: {len(chars)} unique chars")
    print(f"Fonts found:   {len(fonts)} → {[os.path.basename(f) for f in fonts]}")
    print(f"Generating {len(chars) * SAMPLES_PER_CLS:,} training samples …")

    dataset = CharDataset(chars, fonts)
    # Rebuild class list to match only chars that actually rendered
    rendered_labels = sorted({label for _, label in dataset.items})
    label_remap = {old: new for new, old in enumerate(rendered_labels)}
    final_chars  = [chars[i] for i in rendered_labels]
    dataset.items = [(arr, label_remap[lbl]) for arr, lbl in dataset.items]

    print(f"Effective classes after font check: {len(final_chars)}")

    n_val   = max(len(final_chars), int(len(dataset) * 0.08))
    n_train = len(dataset) - n_val
    train_ds, val_ds = torch.utils.data.random_split(dataset, [n_train, n_val])

    train_loader = DataLoader(train_ds, batch_size=BATCH, shuffle=True,  num_workers=0, pin_memory=False)
    val_loader   = DataLoader(val_ds,   batch_size=BATCH, shuffle=False, num_workers=0)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Training on {device}  ({EPOCHS} epochs)")

    model     = CharCNN(len(final_chars)).to(device)
    opt       = optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-4)
    sched     = optim.lr_scheduler.CosineAnnealingLR(opt, T_max=EPOCHS)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

    best_acc, best_state = 0.0, None

    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_loss = 0.0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            opt.zero_grad()
            loss = criterion(model(x), y)
            loss.backward()
            opt.step()
            total_loss += loss.item()
        sched.step()

        if epoch % 5 == 0 or epoch == EPOCHS:
            model.eval()
            correct = total = 0
            with torch.no_grad():
                for x, y in val_loader:
                    x, y = x.to(device), y.to(device)
                    correct += (model(x).argmax(1) == y).sum().item()
                    total   += y.size(0)
            acc = correct / total
            print(f"  epoch {epoch:3d}/{EPOCHS}  loss {total_loss/len(train_loader):.4f}  val_acc {acc:.3f}")
            if acc > best_acc:
                best_acc   = acc
                best_state = {k: v.clone() for k, v in model.state_dict().items()}

    print(f"\nBest val accuracy: {best_acc:.3f}")
    if best_state:
        model.load_state_dict(best_state)

    # ─── Export ───────────────────────────────────────────────────────────────
    os.makedirs('public/models', exist_ok=True)
    model.eval().cpu()
    dummy = torch.zeros(1, 1, SIZE, SIZE)

    torch.onnx.export(
        model, dummy,
        'public/models/recognizer.onnx',
        input_names=['input'],
        output_names=['logits'],
        opset_version=11,
        dynamic_axes={'input': {0: 'batch'}, 'logits': {0: 'batch'}},
    )

    with open('public/models/classes.json', 'w', encoding='utf-8') as f:
        json.dump(final_chars, f, ensure_ascii=False)

    size_mb = os.path.getsize('public/models/recognizer.onnx') / 1e6
    print(f"\nSaved public/models/recognizer.onnx  ({size_mb:.1f} MB)")
    print(f"Saved public/models/classes.json      ({len(final_chars)} classes)")

    # Quick ONNX validity check
    try:
        import onnx
        onnx.checker.check_model(onnx.load('public/models/recognizer.onnx'))
        print("ONNX model valid ✓")
    except ImportError:
        print("(install `pip install onnx` to validate the model)")


if __name__ == '__main__':
    train()
