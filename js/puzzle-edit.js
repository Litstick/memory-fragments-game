/* ===== 谜题编辑管理 ===== */
const PuzzleEdit = {
  editingIndex: -1,

  open(index) {
    this.editingIndex = index;
    const modal = document.getElementById('modal-puzzle-edit');
    const title = document.getElementById('puzzle-edit-title');

    if (index >= 0) {
      title.textContent = '编辑谜题';
      const p = ChapterEdit.tempPuzzles[index];
      document.getElementById('edit-puzzle-type').value = p.type || 'text';
      document.getElementById('edit-puzzle-question').value = p.question || '';
      document.getElementById('edit-puzzle-answer').value = p.answer || '';
      document.getElementById('edit-puzzle-hint').value = p.hint || '';
      document.getElementById('edit-puzzle-piece').value = p.piece || 1;
    } else {
      title.textContent = '添加新谜题';
      document.getElementById('edit-puzzle-type').value = 'text';
      document.getElementById('edit-puzzle-question').value = '';
      document.getElementById('edit-puzzle-answer').value = '';
      document.getElementById('edit-puzzle-hint').value = '';
      // 自动计算下一个可用的拼图块编号
      const usedPieces = ChapterEdit.tempPuzzles.map(p => p.piece);
      let nextPiece = 1;
      while (usedPieces.includes(nextPiece)) nextPiece++;
      document.getElementById('edit-puzzle-piece').value = nextPiece;
    }

    modal.classList.add('active');
  },

  close() {
    document.getElementById('modal-puzzle-edit').classList.remove('active');
  },

  save() {
    const question = document.getElementById('edit-puzzle-question').value.trim();
    const answer = document.getElementById('edit-puzzle-answer').value.trim();
    const piece = parseInt(document.getElementById('edit-puzzle-piece').value);

    if (!question) { Utils.showToast('请输入谜题题目', 'error'); return; }
    if (!answer) { Utils.showToast('请输入正确答案', 'error'); return; }
    if (!piece || piece < 1) { Utils.showToast('请输入有效的拼图块编号', 'error'); return; }

    const data = {
      id: this.editingIndex >= 0 ? ChapterEdit.tempPuzzles[this.editingIndex].id : Utils.genId(),
      type: document.getElementById('edit-puzzle-type').value,
      question: question,
      answer: answer,
      hint: document.getElementById('edit-puzzle-hint').value.trim(),
      piece: piece
    };

    if (this.editingIndex >= 0) {
      ChapterEdit.tempPuzzles[this.editingIndex] = data;
    } else {
      ChapterEdit.tempPuzzles.push(data);
    }

    ChapterEdit.renderPuzzleList();
    this.close();
    Utils.showToast('谜题已保存', 'success');
  }
};
