/* ===== 游戏核心逻辑 ===== */
const Game = {
  currentChapter: -1,
  currentPage: 'page-menu',

  init() {
    this.checkSaveData();
    Utils.createParticles('menu-particles', 25);
  },

  checkSaveData() {
    const state = Storage.getGameState();
    const btn = document.getElementById('btn-continue');
    if (state && state.chapters && Object.keys(state.chapters).length > 0) {
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
  },

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

  startNew() {
    const chapters = Storage.getChapters();
    if (chapters.length === 0) {
      Utils.showToast('还没有章节！请先在设置中添加章节或加载示例模板', 'error');
      return;
    }
    Storage.clearGameState();
    this.showPage('page-chapters');
  },

  continueGame() {
    const chapters = Storage.getChapters();
    if (chapters.length === 0) {
      Utils.showToast('还没有章节！', 'error');
      return;
    }
    this.showPage('page-chapters');
  },

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

  enterChapter(index) {
    this.currentChapter = index;
    const chapters = Storage.getChapters();
    const ch = chapters[index];

    document.getElementById('game-chapter-title').textContent = ch.name || `第${index + 1}章`;
    this.showPage('page-game');
    this.hideCluePanel();
    requestAnimationFrame(() => {
      this.renderPuzzleGrid();
    });
  },

  exitToChapters() {
    this.autoSave();
    this.showPage('page-chapters');
  },

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

    const puzzleArea = document.querySelector('.puzzle-area');
    const areaW = puzzleArea.clientWidth - 40;
    const areaH = puzzleArea.clientHeight - 20;
    const maxPieceSize = Math.min(
      Math.floor((areaW - (cols - 1) * 6 - 6) / cols),
      Math.floor((areaH - (rows - 1) * 6 - 6) / rows)
    );
    const pieceSize = Math.max(Math.min(maxPieceSize, 120), 60);

    grid.style.width = (pieceSize * cols + (cols - 1) * 6 + 6) + 'px';
    grid.style.height = (pieceSize * rows + (rows - 1) * 6 + 6) + 'px';

    grid.innerHTML = '';

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

    // 统一事件绑定：始终绑定，内部判断状态
    piece.addEventListener('click', () => {
      if (!piece.classList.contains('unlocked')) {
        Puzzle.open(index + 1);
      }
    });

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

    // 统一事件绑定：始终绑定，内部判断状态
    piece.addEventListener('click', () => {
      if (!piece.classList.contains('unlocked')) {
        Puzzle.open(index + 1);
      }
    });

    return piece;
  },

  unlockPiece(pieceNum) {
    const chapters = Storage.getChapters();
    const ch = chapters[this.currentChapter];
    const totalPieces = ch.gridRows * ch.gridCols;

    const unlocked = Storage.getChapterProgress(this.currentChapter);
    if (!unlocked.includes(pieceNum)) {
      unlocked.push(pieceNum);
      Storage.updateChapterProgress(this.currentChapter, unlocked);
    }

    const pieces = document.querySelectorAll('.puzzle-piece');
    pieces.forEach(piece => {
      if (parseInt(piece.dataset.index) === pieceNum) {
        // 直接修改类，不需要克隆替换
        piece.classList.remove('locked');
        piece.classList.add('unlocked', 'just-unlocked');
        piece.style.cursor = 'default';
        setTimeout(() => {
          piece.classList.remove('just-unlocked');
        }, 600);
      }
    });

    this.updateProgress();
    this.renderClueList();

    if (unlocked.length >= totalPieces) {
      Storage.markChapterComplete(this.currentChapter);
      setTimeout(() => {
        Story.show(this.currentChapter);
      }, 800);
    }
  },

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

  showCluePanel() {
    this.renderClueList();
    document.getElementById('clue-panel').classList.add('open');
  },

  hideCluePanel() {
    document.getElementById('clue-panel').classList.remove('open');
  },

  // 高亮拼图块（用于线索板点击跳转）
  highlightPiece(pieceNum) {
    const pieces = document.querySelectorAll('.puzzle-piece');
    pieces.forEach(piece => {
      if (parseInt(piece.dataset.index) === pieceNum) {
        piece.classList.add('highlight-pulse');
        setTimeout(() => piece.classList.remove('highlight-pulse'), 2000);
      }
    });
  },

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

      // 线索板点击功能
      if (!isFound) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
          this.hideCluePanel();
          this.highlightPiece(puzzle.piece);
          Utils.showToast(`点击拼图块 #${puzzle.piece} 来解开这个谜题`, 'info');
        });
      }

      item.innerHTML = `
        <div class="clue-item-label">线索 #${puzzle.piece}</div>
        <div class="clue-item-text ${isFound ? '' : 'unknown'}">${isFound ? puzzle.question : '??? 未发现'}</div>
      `;
      list.appendChild(item);
    });
  },

  autoSave() {
    // 进度在每次解锁时已自动保存
  }
};
