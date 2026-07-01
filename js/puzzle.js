/* ===== 谜题交互 ===== */
const Puzzle = {
  currentPiece: -1,
  currentPuzzle: null,
  attempts: 0,

  open(pieceNum) {
    const chapters = Storage.getChapters();
    const ch = chapters[Game.currentChapter];
    if (!ch) return;

    // 查找关联该拼图块的谜题
    const puzzle = ch.puzzles.find(p => p.piece === pieceNum);
    if (!puzzle) {
      Utils.showToast('该拼图块没有关联谜题', 'error');
      return;
    }

    this.currentPiece = pieceNum;
    this.currentPuzzle = puzzle;
    this.attempts = 0;

    const modal = document.getElementById('modal-puzzle');
    const body = document.getElementById('puzzle-body');
    const title = document.getElementById('puzzle-title');

    title.textContent = `拼图块 #${pieceNum}`;

    // 渲染问题
    let html = PuzzleTypes.renderQuestion(puzzle);

    // 提示区域
    const hintText = PuzzleTypes.getHintText(puzzle);
    html += `<div class="puzzle-hint" id="puzzle-hint-text">💡 ${hintText}</div>`;

    // 结果区域
    html += `<div class="puzzle-result" id="puzzle-result"></div>`;

    // 输入区域
    html += `
      <div class="puzzle-input-group">
        <input type="text" class="puzzle-input" id="puzzle-answer-input"
          placeholder="输入你的答案..." autocomplete="off">
      </div>
      <div class="puzzle-actions">
        <button class="btn-hint" onclick="Puzzle.showHint()">💡 显示提示</button>
      </div>
    `;

    body.innerHTML = html;

    // 聚焦输入框
    setTimeout(() => {
      const input = document.getElementById('puzzle-answer-input');
      if (input) input.focus();
      // 回车提交
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.submit();
      });
    }, 100);

    modal.classList.add('active');
  },

  showHint() {
    const hint = document.getElementById('puzzle-hint-text');
    if (hint) hint.classList.add('show');
  },

  submit() {
    const input = document.getElementById('puzzle-answer-input');
    const result = document.getElementById('puzzle-result');
    const userAnswer = input ? input.value.trim() : '';

    if (!userAnswer) {
      Utils.showToast('请输入答案', 'error');
      return;
    }

    this.attempts++;

    if (PuzzleTypes.validate(this.currentPuzzle, userAnswer)) {
      // 正确
      result.className = 'puzzle-result success';
      result.textContent = '✨ 正确！拼图块已解锁！';
      result.style.display = 'block';

      input.disabled = true;
      document.getElementById('puzzle-submit').disabled = true;

      setTimeout(() => {
        this.close();
        Game.unlockPiece(this.currentPiece);
        Utils.showToast('拼图块已解锁！', 'success');
      }, 1500);
    } else {
      // 错误
      result.className = 'puzzle-result failure';
      if (this.attempts >= 3) {
        result.textContent = `答案错误（已尝试${this.attempts}次）。提示已自动显示。`;
        this.showHint();
      } else {
        result.textContent = `答案错误，请再试一次。（已尝试${this.attempts}次）`;
      }
      result.style.display = 'block';

      // 抖动动画
      if (input) {
        input.style.animation = 'none';
        input.offsetHeight; // reflow
        input.style.animation = 'shake 0.4s ease';
      }
    }
  },

  close() {
    document.getElementById('modal-puzzle').classList.remove('active');
    this.currentPiece = -1;
    this.currentPuzzle = null;
    this.attempts = 0;
  }
};

// 抖动动画
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
`;
document.head.appendChild(shakeStyle);
