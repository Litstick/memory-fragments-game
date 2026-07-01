/* ===== 设置页面管理 ===== */
const Settings = {
  init() {
    this.renderChapterList();
    this.initDefaultImageUpload();
  },

  // 默认图片上传
  initDefaultImageUpload() {
    const area = document.getElementById('upload-default-image');
    const input = document.getElementById('input-default-image');
    const preview = document.getElementById('preview-default-image');
    const placeholder = area.querySelector('.upload-placeholder');

    // 显示已保存的图片
    const savedImg = Storage.getDefaultImage();
    if (savedImg) {
      preview.src = savedImg;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
    }

    area.addEventListener('click', () => input.click());

    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      area.classList.add('dragover');
    });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.handleDefaultImage(file);
      }
    });

    input.addEventListener('change', () => {
      if (input.files[0]) this.handleDefaultImage(input.files[0]);
    });
  },

  async handleDefaultImage(file) {
    const dataUrl = await Utils.readFileAsDataURL(file);
    const compressed = await Utils.compressImage(dataUrl, 800);
    Storage.saveDefaultImage(compressed);

    const preview = document.getElementById('preview-default-image');
    const placeholder = document.getElementById('upload-default-image').querySelector('.upload-placeholder');
    preview.src = compressed;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
    Utils.showToast('默认图片已保存', 'success');
  },

  // 渲染章节列表
  renderChapterList() {
    const list = document.getElementById('settings-chapter-list');
    const chapters = Storage.getChapters();
    list.innerHTML = '';

    chapters.forEach((ch, idx) => {
      const item = document.createElement('div');
      item.className = 'chapter-list-item';
      const imgSrc = ch.image || '';
      const imgHtml = imgSrc
        ? `<img src="${imgSrc}" alt="">`
        : `<img src="" alt="" style="display:none;"><div style="width:48px;height:48px;background:var(--color-puzzle-locked);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--color-text-dim);">?</div>`;

      item.innerHTML = `
        ${imgHtml}
        <div class="chapter-list-item-info">
          <div class="chapter-list-item-name">${ch.name || '未命名章节'}</div>
          <div class="chapter-list-item-detail">${ch.gridRows || 3}×${ch.gridCols || 3} 拼图 · ${ch.puzzles ? ch.puzzles.length : 0} 个谜题</div>
        </div>
        <div class="chapter-list-item-actions">
          <button class="btn-tiny" onclick="Settings.editChapter(${idx})">编辑</button>
          <button class="btn-tiny delete" onclick="Settings.deleteChapter(${idx})">删除</button>
        </div>
      `;
      list.appendChild(item);
    });
  },

  // 添加章节
  addChapter() {
    ChapterEdit.open(-1);
  },

  // 编辑章节
  editChapter(index) {
    ChapterEdit.open(index);
  },

  // 删除章节
  deleteChapter(index) {
    if (!confirm('确定删除该章节？此操作不可撤销。')) return;
    const chapters = Storage.getChapters();
    chapters.splice(index, 1);
    Storage.saveChapters(chapters);
    this.renderChapterList();
    Utils.showToast('章节已删除', 'success');
  },

  // 加载示例模板
  loadTemplate() {
    if (!confirm('加载模板将覆盖当前所有章节配置，确定继续吗？')) return;

    const templateChapters = [
      {
        id: Utils.genId(),
        name: '第1章 - 迷失的日记',
        image: '',
        gridRows: 3,
        gridCols: 3,
        story: '亲爱的读者，\n\n当你拼完这些碎片时，你已经在我的记忆里走了一趟。\n\n我叫林晓，2024年的那个夏天，我在老宅的阁楼上发现了一本泛黄的日记。日记的主人是我从未谋面的祖母。\n\n她写道："每个人心中都有一扇门，门后是那些被遗忘的时光。当你准备好的时候，那扇门就会自己打开。"\n\n我不知道这句话的含义，直到那天——\n\n窗外的雨停了，阳光透过云层洒落在日记本上，我翻到了最后一页。那里只写着一个地址，和一行字：\n\n"去找那棵树，答案就在树根下。"\n\n——林晓\n2024年7月15日',
        video: '',
        puzzles: [
          {
            id: Utils.genId(),
            type: 'text',
            question: '日记的主人是谁的祖母？',
            answer: '林晓',
            hint: '日记发现者叫什么名字？',
            piece: 1
          },
          {
            id: Utils.genId(),
            type: 'riddle',
            question: '"每个人心中都有一扇门"——这扇门后面是什么？',
            answer: '被遗忘的时光',
            hint: '日记中祖母写的那句话。',
            piece: 2
          },
          {
            id: Utils.genId(),
            type: 'cipher',
            question: '这段密文隐藏着季节信息：\n NKRRU YT JFYJ',
            answer: 'SUMMER IN MAY',
            hint: '试试凯撒密码，每个字母向后移了2位。',
            piece: 3
          },
          {
            id: Utils.genId(),
            type: 'reverse',
            question: '这行倒序的文字记录了发现日记的地点：\n 楼阁的老宅',
            answer: '老宅的阁楼',
            hint: '试着把文字从后往前读。',
            piece: 4
          },
          {
            id: Utils.genId(),
            type: 'math',
            question: '日记写于2024年。祖母去世那年，林晓刚满10岁。如果2024年林晓25岁，祖母是哪年去世的？请输入年份。',
            answer: '2009',
            hint: '25 - 10 = 15年前。',
            piece: 5
          },
          {
            id: Utils.genId(),
            type: 'password',
            question: '最后一页写着"去找那棵树，答案就在树根下"。如果这棵树的品种是日记中提到的天气隐喻——连日____（提示：一种自然现象），请输入这个两字词语。',
            answer: '阴雨',
            hint: '日记中提到窗外什么停了？',
            piece: 6
          },
          {
            id: Utils.genId(),
            type: 'text',
            question: '林晓是在哪一年发现日记的？',
            answer: '2024',
            hint: '日记的落款时间。',
            piece: 7
          },
          {
            id: Utils.genId(),
            type: 'reverse',
            question: '倒序的月份：五月的正 -> 月正五',
            answer: '五月十五',
            hint: '日记的落款日期。',
            piece: 8
          },
          {
            id: Utils.genId(),
            type: 'text',
            question: '完成所有谜题后，故事的核心主题是什么？（两个字）',
            answer: '记忆',
            hint: '看看这个游戏的名字。',
            piece: 9
          }
        ]
      },
      {
        id: Utils.genId(),
        name: '第2章 - 树下的秘密',
        image: '',
        gridRows: 3,
        gridCols: 3,
        story: '我按照日记的指引，找到了那棵老橡树。\n\n它的树根盘根错节，像一只张开的手掌，牢牢抓住大地。我蹲下身，拨开落叶和泥土——\n\n一个铁盒。\n\n盒子里装着几张泛黄的照片，和一个信封。照片上是年轻时的祖母，和一个我看不清面容的男人。他们站在同一棵橡树下，笑得很开心。\n\n信封上写着："给我的孙女——当你找到这些，说明你终于准备好了。"\n\n我颤抖着拆开信封。\n\n"亲爱的孩子，如果你正在读这封信，说明你已经走上了寻找真相的路。这些照片里的男人，是你的祖父。他在你还很小的时候就离开了。不是因为他不爱我们，而是因为他发现了一个秘密——一个关于这个家族的秘密。\n\n那个秘密就藏在这些记忆碎片中。继续寻找吧。\n\n永远爱你的，祖母"',
        video: '',
        puzzles: [
          {
            id: Utils.genId(),
            type: 'text',
            question: '林晓在什么树下找到了铁盒？',
            answer: '老橡树',
            hint: '日记中提到了一种树。',
            piece: 1
          },
          {
            id: Utils.genId(),
            type: 'text',
            question: '铁盒里装着什么？（两个字）',
            answer: '照片',
            hint: '记录影像的东西。',
            piece: 2
          },
          {
            id: Utils.genId(),
            type: 'riddle',
            question: '"它的树根盘根错节，像一只张开的手掌"——形容的是什么？',
            answer: '老橡树的根',
            hint: '什么东西像手掌一样抓住大地？',
            piece: 3
          },
          {
            id: Utils.genId(),
            type: 'cipher',
            question: '密文：LQWHVWLQH\n提示：每个字母后移3位',
            answer: 'INVESTIGATE',
            hint: '祖母希望林晓去做什么？',
            piece: 4
          },
          {
            id: Utils.genId(),
            type: 'text',
            question: '信封是写给谁的？',
            answer: '孙女',
            hint: '祖母的后代。',
            piece: 5
          },
          {
            id: Utils.genId(),
            type: 'password',
            question: '照片里有几个人？',
            answer: '2',
            hint: '祖母和另一个人。',
            piece: 6
          },
          {
            id: Utils.genId(),
            type: 'reverse',
            question: '倒序文字： 密秘的族家个一于关 ',
            answer: '关于一个家族的秘密',
            hint: '祖父发现了一个什么？',
            piece: 7
          },
          {
            id: Utils.genId(),
            type: 'math',
            question: '如果每张照片代表了1年，5张照片代表了多少年的记忆？加上2024，答案是多少？',
            answer: '2029',
            hint: '2024 + 5 = ?',
            piece: 8
          },
          {
            id: Utils.genId(),
            type: 'text',
            question: '信中提到的"家族的秘密"，具体藏在什么里面？',
            answer: '记忆碎片',
            hint: '这个游戏的名字就是答案。',
            piece: 9
          }
        ]
      },
      {
        id: Utils.genId(),
        name: '第3章 - 真相大白',
        image: '',
        gridRows: 3,
        gridCols: 3,
        story: '所有的碎片终于拼凑在了一起。\n\n祖父并不是不辞而别。当年，他发现家族传承了一种特殊的能力——"记忆编织"。拥有这种能力的人，可以将自己的记忆编织成实物，封存在日常物品中。\n\n祖母的首饰盒、窗边的风铃、后院的石凳……每一样东西都封存着一段珍贵的记忆。\n\n祖父之所以离开，是因为他意识到这种能力正在失控。如果不加以控制，编织出来的记忆会逐渐侵蚀持有者的现实认知，让人分不清哪些是真实的经历，哪些是编织的记忆。\n\n他独自去了很远的地方，试图找到控制这种能力的方法。而那些日记、照片和线索，都是他留给家人的路标。\n\n我终于明白了。\n\n我合上日记，看着窗外。阳光洒在老宅的木地板上，每一块木板的纹路似乎都在讲述着一段故事。\n\n"原来如此，"我轻声说道，"这就是记忆碎片的真正含义。"\n\n—— 完 ——',
        video: '',
        puzzles: [
          {
            id: Utils.genId(),
            type: 'text',
            question: '家族传承的特殊能力叫什么？（四个字）',
            answer: '记忆编织',
            hint: '将记忆编织成实物。',
            piece: 1
          },
          {
            id: Utils.genId(),
            type: 'text',
            question: '记忆被编织后封存在什么中？',
            answer: '日常物品',
            hint: '祖母的首饰盒属于什么类别？',
            piece: 2
          },
          {
            id: Utils.genId(),
            type: 'riddle',
            question: '"编织出来的记忆会逐渐侵蚀持有者的什么？"（两个字）',
            answer: '认知',
            hint: '让人分不清现实和记忆的能力。',
            piece: 3
          },
          {
            id: Utils.genId(),
            type: 'reverse',
            question: '倒序文字： 法方的法控找寻试 ',
            answer: '试图找到控制方法',
            hint: '祖父独自远行是为了什么？',
            piece: 4
          },
          {
            id: Utils.genId(),
            type: 'password',
            question: '日记、照片和线索是祖父留给家人的什么？（两个字）',
            answer: '路标',
            hint: '指引方向的标记。',
            piece: 5
          },
          {
            id: Utils.genId(),
            type: 'math',
            question: '祖母的首饰盒(1)、风铃(2)、石凳(3)——如果每件物品代表1段记忆，祖母一共封存了多少段记忆？',
            answer: '3',
            hint: '数一下提到的物品数量。',
            piece: 6
          },
          {
            id: Utils.genId(),
            type: 'cipher',
            question: '密文：WR BRX UHVROYH LW"（移位3位解密）',
            answer: 'TO YOU RESOLVE IT',
            hint: '解开这个凯撒密码。',
            piece: 7
          },
          {
            id: Utils.genId(),
            type: 'text',
            question: '故事最后，"我"看到了什么地方的木地板纹路在讲故事？',
            answer: '老宅',
            hint: '整个故事发生的地方。',
            piece: 8
          },
          {
            id: Utils.genId(),
            type: 'text',
            question: '这个游戏的真正主题是什么？（四个字）',
            answer: '记忆碎片',
            hint: '看看游戏标题。',
            piece: 9
          }
        ]
      }
    ];

    Storage.saveChapters(templateChapters);
    this.renderChapterList();
    Utils.showToast('示例模板已加载（3个章节）', 'success');
  },

  // 清除所有数据
  clearAll() {
    if (!confirm('确定清除所有游戏数据和章节配置？此操作不可恢复！')) return;
    if (!confirm('再次确认：这将删除所有章节、进度和图片数据！')) return;
    localStorage.removeItem(Storage.KEYS.CHAPTERS);
    localStorage.removeItem(Storage.KEYS.GAME_STATE);
    localStorage.removeItem(Storage.KEYS.DEFAULT_IMAGE);
    this.renderChapterList();
    // 重置默认图片预览
    const preview = document.getElementById('preview-default-image');
    const placeholder = document.getElementById('upload-default-image').querySelector('.upload-placeholder');
    preview.style.display = 'none';
    preview.src = '';
    placeholder.style.display = 'flex';
    Utils.showToast('所有数据已清除', 'success');
  }
};
