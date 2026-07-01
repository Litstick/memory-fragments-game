/* ===== 章节编辑管理 ===== */
const ChapterEdit = {
  editingIndex: -1,  // -1 表示新增
  tempImage: '',
  tempPuzzles: [],

  open(index) {
    this.editingIndex = index;
    this.tempImage = '';
    this.tempPuzzles = [];

    const modal = document.getElementById('modal-chapter-edit');
    const title = document.getElementById('chapter-edit-title');

    if (index >= 0) {
      // 编辑模式
      const chapters = Storage.getChapters();
      const ch = chapters[index];
      title.textContent = '编辑章节';
      document.getElementById('edit-chapter-name').value = ch.name || '';
      document.getElementById('edit-grid-rows').value = ch.gridRows || 3;
      document.getElementById('edit-grid-cols').value = ch.gridCols || 3;
      document.getElementById('edit-chapter-story').value = ch.story || '';
      document.getElementById('edit-chapter-video').value = ch.video || '';

      if (ch.image) {
        this.tempImage = ch.image;
        const preview = document.getElementById('preview-chapter-image');
        preview.src = ch.image;
        preview.style.display = 'block';
        document.getElementById('upload-chapter-image').querySelector('.upload-placeholder').style.display = 'none';
      } else {
        this.resetImagePreview();
      }

      if (ch.puzzles) {
        this.tempPuzzles = JSON.parse(JSON.stringify(ch.puzzles));
      }
    } else {
      // 新增模式
      title.textContent = '添加新章节';
      document.getElementById('edit-chapter-name').value = '';
      document.getElementById('edit-grid-rows').value = '3';
      document.getElementById('edit-grid-cols').value = '3';
      document.getElementById('edit-chapter-story').value = '';
      document.getElementById('edit-chapter-video').value = '';
      this.resetImagePreview();
    }

    this.renderPuzzleList();
    this.initImageUpload();
    modal.classList.add('active');
  },

  close() {
    document.getElementById('modal-chapter-edit').classList.remove('active');
  },

  resetImagePreview() {
    const preview = document.getElementById('preview-chapter-image');
    const placeholder = document.getElementById('upload-chapter-image').querySelector('.upload-placeholder');
    preview.style.display = 'none';
    preview.src = '';
    placeholder.style.display = 'flex';
    this.tempImage = '';
  },

  initImageUpload() {
    const area = document.getElementById('upload-chapter-image');
    const input = document.getElementById('input-chapter-image');
    const preview = document.getElementById('preview-chapter-image');
    const placeholder = area.querySelector('.upload-placeholder');

    // 移除旧的事件监听器（通过替换节点）
    const newArea = area.cloneNode(true);
    area.parentNode.replaceChild(newArea, area);
    const newInput = newArea.querySelector('input[type="file"]');

    newArea.addEventListener('click', () => newInput.click());
    newArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      newArea.classList.add('dragover');
    });
    newArea.addEventListener('dragleave', () => newArea.classList.remove('dragover'));
    newArea.addEventListener('drop', (e) => {
      e.preventDefault();
      newArea.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) this.handleImage(file);
    });
    newInput.addEventListener('change', () => {
      if (newInput.files[0]) this.handleImage(newInput.files[0]);
    });
  },

  async handleImage(file) {
    const dataUrl = await Utils.readFileAsDataURL(file);
    const compressed = await Utils.compressImage(dataUrl, 800);
    this.tempImage = compressed;

    // 需要重新查找元素（因为 cloneNode 替换了）
    const area = document.getElementById('upload-chapter-image');
    const preview = area.querySelector('.upload-preview');
    const placeholder = area.querySelector('.upload-placeholder');
    if (preview) {
      preview.src = compressed;
      preview.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
  },

  // 渲染谜题列表
  renderPuzzleList() {
    const list = document.getElementById('edit-puzzle-list');
    list.innerHTML = '';

    this.tempPuzzles.forEach((p, idx) => {
      const item = document.createElement('div');
      item.className = 'puzzle-list-item';
      item.innerHTML = `
        <div class="puzzle-list-item-info">
          <div class="puzzle-list-item-name">${PuzzleTypes.getTypeName(p.type)}: ${(p.question || '').substring(0, 20)}${(p.question || '').length > 20 ? '...' : ''}</div>
          <div class="puzzle-list-item-type">答案: ${p.answer || '未设置'}</div>
        </div>
        <div class="puzzle-list-item-piece">拼图块 #${p.piece || '?'}</div>
        <button class="btn-tiny delete" onclick="ChapterEdit.removePuzzle(${idx})">删除</button>
      `;
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete')) PuzzleEdit.open(idx);
      });
      list.appendChild(item);
    });
  },

  addPuzzle() {
    PuzzleEdit.open(-1);
  },

  removePuzzle(index) {
    this.tempPuzzles.splice(index, 1);
    this.renderPuzzleList();
  },

  save() {
    const name = document.getElementById('edit-chapter-name').value.trim();
    if (!name) {
      Utils.showToast('请输入章节标题', 'error');
      return;
    }

    const rows = parseInt(document.getElementById('edit-grid-rows').value);
    const cols = parseInt(document.getElementById('edit-grid-cols').value);
    const totalPieces = rows * cols;

    // 检查拼图块编号是否有效
    for (const p of this.tempPuzzles) {
      if (p.piece < 1 || p.piece > totalPieces) {
        Utils.showToast(`谜题"${p.question.substring(0,10)}"关联的拼图块编号超出范围(1-${totalPieces})`, 'error');
        return;
      }
    }

    const chapterData = {
      id: this.editingIndex >= 0
        ? Storage.getChapters()[this.editingIndex].id
        : Utils.genId(),
      name: name,
      image: this.tempImage || Storage.getDefaultImage() || '',
      gridRows: rows,
      gridCols: cols,
      story: document.getElementById('edit-chapter-story').value,
      video: document.getElementById('edit-chapter-video').value.trim(),
      puzzles: this.tempPuzzles
    };

    const chapters = Storage.getChapters();

    if (this.editingIndex >= 0) {
      chapters[this.editingIndex] = chapterData;
    } else {
      chapters.push(chapterData);
    }

    Storage.saveChapters(chapters);
    Settings.renderChapterList();
    this.close();
    Utils.showToast(this.editingIndex >= 0 ? '章节已更新' : '章节已添加', 'success');
  }
};
