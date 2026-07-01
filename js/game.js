/* ===== 游戏核心逻辑 ===== */
const Game = {
  currentChapter: -1,
  currentPage: 'page-menu',

  init() {
    // 检查是否有存档
    this.checkSaveData();
    // 创建菜单粒子
    Utils.createParticles('menu-particles', 25);
  },

  // 检查存档
  checkSaveData() {
    const state = Storage.getGameState();
    const btn = document.getElementById('btn-continue');
    if (state && state.chapters && Object.keys(state.chapters).length > 0) {
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
  },

  // 页面切换
  showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => {
      p.classList.remove('active', 'fade-in');
    });
    const target = document.getElementById(pageId);
    target.classList.add('active', 'fade-in');
    this.currentPage = pageId;

    if (pageId === 'page-chapters') {
      this.renderChapterGrid();
    }
    if (pageId === 'page-settings') {
      Settings.renderChapterList();
      Settings.initDefaultImageUpload();
    }
  },

  // 开始新游戏
  startNew() {
    const chapters = Storage.getChapters();
    if (chapters.length === 0) {
      Utils.showToast('还没有章节！请先在设置中添加章节或加载示例模板', 'error');
      return;
    }
    Storage.clearGameState();
    this.showPage('page-chapters');
  },

  // 继续游戏
  continueGame() {
    const chapters = Storage.getChapters();
    if (chapters.length === 0) {
      Utils.showToast('还没有章节！', 'error');
      return;
    }
    this.showPage('page-chapters');
  },

  // 渲染章节网格
  renderChapterGrid() {
    const grid = document.getElementById('chapters-grid');
    const chapters = Storage.getChapters();
    grid.innerHTML = '';

    chapters.forEach((ch, idx) => {
      const card = document.createElement('div');
      card.className = 'chapter-card';
      card.onclick = () => this.enterChapter(idx);

      const isComplete = Storage.isChapterComplete(idx);
      const progress = this.getChapterProgress(idx, ch);
      const totalPieces = ch.gridRows * ch.gridCols;

      let imgHtml;
      if (ch.image) {
        imgHtml = `<img class="chapter-card-img" src="${ch.image}" alt="${ch.name}">`;
      } else {
        imgHtml = `<div class="chapter-card-placeholder">🧩</div>`;
      }

      let badgeHtml = '';
      if (isComplete) {
        badgeHtml = '<div class="chapter-card-badge">已完成</div>';
      }

      card.innerHTML = `
        ${imgHtml}
        ${badgeHtml}
        <div class="chapter-card-info">
          <div class="chapter-card-name">${ch.name || '未命名章节'}</div>
          <div class="chapter-card-status">${progress}/${totalPieces} 块已解锁</div>
        </div>
      `;

      grid.appendChild(card);
    });
  },

  getChapterProgress(chapterIdx, chapter) {
    if (!chapter) {
      const chapters = Storage.getChapters();
      chapter = chapters[chapterIdx];
    }
    const unlocked = Storage.getChapterProgress(chapterIdx);
    return unlocked.length;
  },

  // 进入章节
  enterChapter(index) {
    this.currentChapter = index;
    const chapters = Storage.getChapters();
    const ch = chapters[index];

    document.getElementById('game-chapter-title').textContent = ch.name || `第${index + 1}章`;
    this.showPage('page-game');
    this.renderPuzzleGrid();
    this.hideCluePanel();
  },

  // 退出到章节选择
  exitToChapters() {
    this.autoSave();
    this.showPage('page-chapters');
  },

  // 渲染拼图网格
  renderPuzzleGrid() {
    const chapters = Storage.getChapters();
    const ch = chapters[this.currentChapter];
    if (!ch) return;

    const grid = document.getElementById('puzzle-grid');
    const rows = ch.gridRows || 3;
    const cols = ch.gridCols || 3;
    const totalPieces = rows * cols;
    const unlocked = Storage.getChapterProgress(this.currentChapter);

    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // 计算合适的拼图尺寸
    const puzzleArea = document.querySelector('.puzzle-area');
    const areaW = puzzleArea.clientWidth - 40;
    const areaH = puzzleArea.clientHeight - 20;
    const maxPieceSize = Math.min(
      Math.floor((areaW - (cols - 1) * 3 - 6) / cols),
      Math.floor((areaH - (rows - 1) * 3 - 6) / rows)
    );
    const pieceSize = Math.min(maxPieceSize, 120);

    grid.innerHTML = '';

    // 加载图片
    const imgSrc = ch.image || '';
    if (imgSrc) {
      const img = new Image();
      img.onload = () => {
        for (let i = 0; i < totalPieces; i++) {
          const piece = this.createPuzzlePiece(img, i, rows, cols, unlocked.includes(i + 1));
          grid.appendChild(piece);
        }
      };
      img.onerror = () => {
        // 图片加载失败，显示占位
        for (let i = 0; i < totalPieces; i++) {
          const piece = this.createPlaceholderPiece(i, unlocked.includes(i + 1));
          grid.appendChild(piece);
        }
      };
      img.src = imgSrc;
    } else {
      for (let i = 0; i < totalPieces; i++) {
        const piece = this.createPlaceholderPiece(i, unlocked.includes(i + 1));
        grid.appendChild(piece);
      }
    }

    this.updateProgress();
  },

  createPuzzlePiece(img, index, rows, cols, isUnlocked) {
    const piece = document.createElement('div');
    piece.className = 'puzzle-piece ' + (isUnlocked ? 'unlocked' : 'locked');
    piece.dataset.index = index + 1;

    // 计算该拼图块对应的图片区域
    const row = Math.floor(index / cols);
    const col = index % cols;
    const bgX = cols > 1 ? (col / (cols - 1)) * 100 : 0;
    const bgY = rows > 1 ? (row / (rows - 1)) * 100 : 0;

    const inner = document.createElement('div');
    inner.className = 'puzzle-piece-inner';
    inner.style.backgroundImage = `url(${img.src})`;
    inner.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
    inner.style.backgroundPosition = `${bgX}% ${bgY}%`;

    piece.appendChild(inner);

    if (!isUnlocked) {
      piece.addEventListener('click', () => Puzzle.open(index + 1));
    }

    return piece;
  },

  createPlaceholderPiece(index, isUnlocked) {
    const piece = document.createElement('div');
    piece.className = 'puzzle-piece ' + (isUnlocked ? 'unlocked' : 'locked');
    piece.dataset.index = index + 1;

    const inner = document.createElement('div');
    inner.className = 'puzzle-piece-inner';
    if (isUnlocked) {
      inner.style.background = 'linear-gradient(135deg, var(--color-primary), var(--color-accent))';
    } else {
      inner.style.background = 'var(--color-puzzle-locked)';
    }

    piece.appendChild(inner);

    if (!isUnlocked) {
      piece.addEventListener('click', () => Puzzle.open(index + 1));
    }

    return piece;
  },

  // 解锁拼图块
  unlockPiece(pieceNum) {
    const chapters = Storage.getChapters();
    const ch = chapters[this.currentChapter];
    const totalPieces = ch.gridRows * ch.gridCols;

    const unlocked = Storage.getChapterProgress(this.currentChapter);
    if (!unlocked.includes(pieceNum)) {
      unlocked.push(pieceNum);
      Storage.updateChapterProgress(this.currentChapter, unlocked);
    }

    // 更新视觉
    const pieces = document.querySelectorAll('.puzzle-piece');
    pieces.forEach(piece => {
      if (parseInt(piece.dataset.index) === pieceNum) {
        piece.classList.remove('locked');
        piece.classList.add('unlocked', 'just-unlocked');
        // 移除点击事件
        piece.replaceWith(piece.cloneNode(true));
        const newPiece = document.querySelector(`.puzzle-piece[data-index="${pieceNum}"]`);
        setTimeout(() => {
          if (newPiece) newPiece.classList.remove('just-unlocked');
        }, 600);
      }
    });

    this.updateProgress();
    this.renderClueList();

    // 检查是否全部解锁
    if (unlocked.length >= totalPieces) {
      Storage.markChapterComplete(this.currentChapter);
      setTimeout(() => {
        Story.show(this.currentChapter);
      }, 800);
    }
  },

  // 更新进度
  updateProgress() {
    const chapters = Storage.getChapters();
    const ch = chapters[this.currentChapter];
    if (!ch) return;

    const totalPieces = ch.gridRows * ch.gridCols;
    const unlocked = Storage.getChapterProgress(this.currentChapter);
    const count = unlocked.length;
    const pct = Math.round((count / totalPieces) * 100);

    document.getElementById('clue-summary').textContent = `已收集线索: ${count}/${totalPieces}`;
    document.getElementById('progress-fill').style.width = pct + '%';
    this.renderClueList();
  },

  // 显示线索面板
  showCluePanel() {
    this.renderClueList();
    document.getElementById('clue-panel').classList.add('open');
  },

  // 隐藏线索面板
  hideCluePanel() {
    document.getElementById('clue-panel').classList.remove('open');
  },

  // 渲染线索列表
  renderClueList() {
    const list = document.getElementById('clue-list');
    const chapters = Storage.getChapters();
    const ch = chapters[this.currentChapter];
    if (!ch) return;

    const unlocked = Storage.getChapterProgress(this.currentChapter);
    list.innerHTML = '';

    ch.puzzles.forEach((puzzle, idx) => {
      const isFound = unlocked.includes(puzzle.piece);
      const item = document.createElement('div');
      item.className = 'clue-item' + (isFound ? ' found' : '');
      item.innerHTML = `
        <div class="clue-item-label">线索 #${puzzle.piece}</div>
        <div class="clue-item-text ${isFound ? '' : 'unknown'}">${isFound ? puzzle.question : '??? 未发现'}</div>
      `;
      list.appendChild(item);
    });
  },

  // 自动保存
  autoSave() {
    // 进度在每次解锁时已自动保存
  }
};
