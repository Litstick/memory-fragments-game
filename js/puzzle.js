/* ===== 谜题交互 ===== */
const Puzzle = {
  currentPiece: -1,
  currentPuzzle: null,
  attempts: 0,
  // 互动机关状态
  dialValues: [0, 0, 0],
  seqPlayerInput: [],
  seqDemoRunning: false,
  patternInput: [],
  patternSvg: null,

  open(pieceNum) {
    const chapters = Storage.getChapters();
    const ch = chapters[Game.currentChapter];
    if (!ch) return;

    const puzzle = ch.puzzles.find(p => p.piece === pieceNum);
    if (!puzzle) {
      Utils.showToast('该拼图块没有关联谜题', 'error');
      return;
    }

    this.currentPiece = pieceNum;
    this.currentPuzzle = puzzle;
    this.attempts = 0;
    this.resetGadgetState();

    const modal = document.getElementById('modal-puzzle');
    const body = document.getElementById('puzzle-body');
    const title = document.getElementById('puzzle-title');
    const submitBtn = document.getElementById('puzzle-submit');

    title.textContent = `拼图块 #${pieceNum}`;

    // 根据类型渲染不同界面
    let html = PuzzleTypes.renderQuestion(puzzle);
    html += `<div class="puzzle-hint" id="puzzle-hint-text">💡 ${PuzzleTypes.getHintText(puzzle)}</div>`;
    html += `<div class="puzzle-result" id="puzzle-result"></div>`;

    switch(puzzle.type) {
      case 'dial':
        html += this.renderDialHTML();
        submitBtn.style.display = 'inline-flex';
        submitBtn.onclick = () => this.submitDial();
        break;
      case 'sequence':
        html += this.renderSequenceHTML();
        submitBtn.style.display = 'none';
        break;
      case 'pattern':
        html += this.renderPatternHTML();
        submitBtn.style.display = 'none';
        break;
      default:
        html += this.renderTextHTML();
        submitBtn.style.display = 'inline-flex';
        submitBtn.onclick = () => this.submitText();
        break;
    }

    body.innerHTML = html;

    // 初始化互动机关
    if (puzzle.type === 'dial') this.initDial();
    if (puzzle.type === 'sequence') this.initSequence();
    if (puzzle.type === 'pattern') this.initPattern();

    // 文字类型聚焦输入框
    if (puzzle.type === 'text' || puzzle.type === 'password' || puzzle.type === 'cipher' ||
        puzzle.type === 'reverse' || puzzle.type === 'riddle' || puzzle.type === 'math') {
      setTimeout(() => {
        const input = document.getElementById('puzzle-answer-input');
        if (input) {
          input.focus();
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.submitText();
          });
        }
      }, 100);
    }

    modal.classList.add('active');
  },

  resetGadgetState() {
    this.dialValues = [0, 0, 0];
    this.seqPlayerInput = [];
    this.seqDemoRunning = false;
    this.patternInput = [];
    this.patternSvg = null;
  },

  // ========== 文字问答渲染（默认） ==========
  renderTextHTML() {
    return `
      <div class="puzzle-input-group">
        <input type="text" class="puzzle-input" id="puzzle-answer-input"
          placeholder="输入你的答案..." autocomplete="off">
      </div>
      <div class="puzzle-actions">
        <button class="btn-hint" onclick="Puzzle.showHint()">💡 显示提示</button>
      </div>
    `;
  },

  submitText() {
    const input = document.getElementById('puzzle-answer-input');
    const userAnswer = input ? input.value.trim() : '';
    this.checkAnswer(userAnswer);
  },

  // ========== 转盘密码锁 ==========
  renderDialHTML() {
    let wheels = '';
    for (let i = 0; i < 3; i++) {
      wheels += `
        <div class="dial-wheel" data-index="${i}">
          <button class="dial-btn dial-up" data-dir="1">▲</button>
          <div class="dial-display" id="dial-disp-${i}">0</div>
          <button class="dial-btn dial-down" data-dir="-1">▼</button>
        </div>
      `;
    }
    return `
      <div class="dial-lock">
        ${wheels}
      </div>
      <div class="puzzle-actions">
        <button class="btn-hint" onclick="Puzzle.showHint()">💡 显示提示</button>
      </div>
    `;
  },

  initDial() {
    this.dialValues = [0, 0, 0];
    document.querySelectorAll('.dial-wheel').forEach(wheel => {
      const idx = parseInt(wheel.dataset.index);
      wheel.querySelectorAll('.dial-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const dir = parseInt(btn.dataset.dir);
          this.dialValues[idx] = (this.dialValues[idx] + dir + 10) % 10;
          document.getElementById(`dial-disp-${idx}`).textContent = this.dialValues[idx];
          // 添加转动动画
          const disp = document.getElementById(`dial-disp-${idx}`);
          disp.style.animation = 'none';
          disp.offsetHeight;
          disp.style.animation = 'dialTick 0.15s ease';
        });
      });
    });
  },

  submitDial() {
    const userAnswer = this.dialValues.join('');
    this.checkAnswer(userAnswer);
  },

  // ========== 颜色序列 ==========
  renderSequenceHTML() {
    const colors = [
      { key: 'red', label: '红', css: '#e74c3c' },
      { key: 'blue', label: '蓝', css: '#3498db' },
      { key: 'green', label: '绿', css: '#2ecc71' },
      { key: 'yellow', label: '黄', css: '#f1c40f' }
    ];
    let pads = '';
    colors.forEach(c => {
      pads += `<div class="seq-pad" data-color="${c.key}" style="--pad-color:${c.css}"><span>${c.label}</span></div>`;
    });
    return `
      <div class="sequence-game">
        <div class="sequence-status" id="seq-status">点击"开始"观察颜色序列</div>
        <div class="sequence-pads">${pads}</div>
        <button class="btn btn-secondary" id="seq-start-btn" onclick="Puzzle.startSequenceDemo()">开始</button>
        <div class="puzzle-actions">
          <button class="btn-hint" onclick="Puzzle.showHint()">💡 显示提示</button>
        </div>
      </div>
    `;
  },

  initSequence() {
    this.seqPlayerInput = [];
    this.seqDemoRunning = false;
  },

  async startSequenceDemo() {
    if (this.seqDemoRunning) return;
    this.seqDemoRunning = true;
    this.seqPlayerInput = [];

    const startBtn = document.getElementById('seq-start-btn');
    if (startBtn) startBtn.style.display = 'none';

    const status = document.getElementById('seq-status');
    status.textContent = '仔细看...';

    const answer = this.currentPuzzle.answer.trim().toLowerCase();
    const seq = answer.split('-');

    // 演示闪烁序列
    for (let i = 0; i < seq.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      const pad = document.querySelector(`.seq-pad[data-color="${seq[i]}"]`);
      if (pad) {
        pad.classList.add('seq-flash');
        setTimeout(() => pad.classList.remove('seq-flash'), 400);
      }
    }

    await new Promise(r => setTimeout(r, 500));
    status.textContent = '轮到你了！按相同顺序点击颜色';
    this.seqDemoRunning = false;

    // 绑定点击事件
    document.querySelectorAll('.seq-pad').forEach(pad => {
      pad.style.cursor = 'pointer';
      pad.addEventListener('click', () => {
        if (this.seqDemoRunning) return;
        const color = pad.dataset.color;
        this.handleSequenceClick(color, pad);
      });
    });
  },

  handleSequenceClick(color, padElement) {
    const answer = this.currentPuzzle.answer.trim().toLowerCase();
    const seq = answer.split('-');

    // 闪烁反馈
    padElement.classList.add('seq-flash');
    setTimeout(() => padElement.classList.remove('seq-flash'), 300);

    this.seqPlayerInput.push(color);

    // 检查当前输入是否正确
    const currentIndex = this.seqPlayerInput.length - 1;
    if (this.seqPlayerInput[currentIndex] !== seq[currentIndex]) {
      // 错误
      this.attempts++;
      document.getElementById('seq-status').textContent = '顺序错误！重新观察序列。';
      this.seqPlayerInput = [];
      document.getElementById('seq-start-btn').style.display = 'inline-flex';
      // 移除点击事件，重新开始演示
      document.querySelectorAll('.seq-pad').forEach(p => {
        p.style.cursor = 'default';
        const newPad = p.cloneNode(true);
        p.parentNode.replaceChild(newPad, p);
      });
      return;
    }

    // 检查是否完成
    if (this.seqPlayerInput.length === seq.length) {
      document.getElementById('seq-status').textContent = '✨ 正确！';
      this.checkAnswer(answer);
    } else {
      document.getElementById('seq-status').textContent = `继续... (${this.seqPlayerInput.length}/${seq.length})`;
    }
  },

  // ========== 图形密码 ==========
  renderPatternHTML() {
    let dots = '';
    for (let i = 1; i <= 9; i++) {
      dots += `<div class="pattern-dot" data-idx="${i}"></div>`;
    }
    return `
      <div class="pattern-lock">
        <svg class="pattern-lines" id="pattern-svg" viewBox="0 0 200 200">
          <line id="pattern-line" x1="0" y1="0" x2="0" y2="0" stroke="var(--color-accent)" stroke-width="3" stroke-linecap="round" opacity="0"/>
        </svg>
        <div class="pattern-dots">${dots}</div>
      </div>
      <div class="sequence-status" id="pattern-status">按顺序点击点阵绘制图案</div>
      <button class="btn btn-secondary" onclick="Puzzle.resetPattern()">重置</button>
      <div class="puzzle-actions">
        <button class="btn-hint" onclick="Puzzle.showHint()">💡 显示提示</button>
      </div>
    `;
  },

  initPattern() {
    this.patternInput = [];
    this.patternSvg = document.getElementById('pattern-svg');

    document.querySelectorAll('.pattern-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset.idx);
        this.handlePatternClick(idx, dot);
      });
    });
  },

  handlePatternClick(idx, dotElement) {
    const answer = this.currentPuzzle.answer.trim().toLowerCase();
    const seq = answer.split('-').map(Number);

    // 检查是否按正确顺序点击
    const expectedIdx = seq[this.patternInput.length];
    if (idx !== expectedIdx) {
      this.attempts++;
      document.getElementById('pattern-status').textContent = '顺序错误！点击"重置"再试一次。';
      dotElement.classList.add('pattern-error');
      setTimeout(() => dotElement.classList.remove('pattern-error'), 400);
      return;
    }

    // 正确
    this.patternInput.push(idx);
    dotElement.classList.add('pattern-active');

    // 画线
    if (this.patternInput.length > 1) {
      this.drawPatternLine(this.patternInput[this.patternInput.length - 2], idx);
    }

    // 检查是否完成
    if (this.patternInput.length === seq.length) {
      document.getElementById('pattern-status').textContent = '✨ 图案正确！';
      setTimeout(() => this.checkAnswer(answer), 500);
    } else {
      document.getElementById('pattern-status').textContent = `继续... (${this.patternInput.length}/${seq.length})`;
    }
  },

  drawPatternLine(fromIdx, toIdx) {
    const fromDot = document.querySelector(`.pattern-dot[data-idx="${fromIdx}"]`);
    const toDot = document.querySelector(`.pattern-dot[data-idx="${toIdx}"]`);
    if (!fromDot || !toDot || !this.patternSvg) return;

    const svgRect = this.patternSvg.getBoundingClientRect();
    const fromRect = fromDot.getBoundingClientRect();
    const toRect = toDot.getBoundingClientRect();

    const x1 = fromRect.left + fromRect.width / 2 - svgRect.left;
    const y1 = fromRect.top + fromRect.height / 2 - svgRect.top;
    const x2 = toRect.left + toRect.width / 2 - svgRect.left;
    const y2 = toRect.top + toRect.height / 2 - svgRect.top;

    // 创建新线条
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'var(--color-accent)');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('opacity', '0.8');
    this.patternSvg.appendChild(line);
  },

  resetPattern() {
    this.patternInput = [];
    document.querySelectorAll('.pattern-dot').forEach(d => d.classList.remove('pattern-active', 'pattern-error'));
    // 清除所有线条（保留第一个作为模板）
    const svg = document.getElementById('pattern-svg');
    if (svg) {
      while (svg.children.length > 1) {
        svg.removeChild(svg.lastChild);
      }
    }
    document.getElementById('pattern-status').textContent = '按顺序点击点阵绘制图案';
  },

  // ========== 通用验证 ==========
  checkAnswer(userAnswer) {
    const result = document.getElementById('puzzle-result');

    if (PuzzleTypes.validate(this.currentPuzzle, userAnswer)) {
      result.className = 'puzzle-result success';
      result.textContent = '✨ 正确！拼图块已解锁！';
      result.style.display = 'block';

      // 禁用所有交互
      this.disableAllInputs();

      setTimeout(() => {
        const pieceNum = this.currentPiece;
        this.close();
        Game.unlockPiece(pieceNum);
        Utils.showToast('拼图块已解锁！', 'success');
      }, 1500);
    } else {
      this.attempts++;
      result.className = 'puzzle-result failure';
      if (this.attempts >= 3) {
        result.textContent = `答案错误（已尝试${this.attempts}次）。提示已自动显示。`;
        this.showHint();
      } else {
        result.textContent = `答案错误，请再试一次。（已尝试${this.attempts}次）`;
      }
      result.style.display = 'block';

      // 抖动效果（文字输入框）
      const input = document.getElementById('puzzle-answer-input');
      if (input) {
        input.style.animation = 'none';
        input.offsetHeight;
        input.style.animation = 'shake 0.4s ease';
      }
    }
  },

  disableAllInputs() {
    const input = document.getElementById('puzzle-answer-input');
    if (input) input.disabled = true;
    const submitBtn = document.getElementById('puzzle-submit');
    if (submitBtn) submitBtn.disabled = true;
    document.querySelectorAll('.dial-btn').forEach(b => b.disabled = true);
    document.querySelectorAll('.seq-pad').forEach(p => p.style.pointerEvents = 'none');
    document.querySelectorAll('.pattern-dot').forEach(d => d.style.pointerEvents = 'none');
  },

  showHint() {
    const hint = document.getElementById('puzzle-hint-text');
    if (hint) hint.classList.add('show');
  },

  close() {
    document.getElementById('modal-puzzle').classList.remove('active');
    this.currentPiece = -1;
    this.currentPuzzle = null;
    this.attempts = 0;
    this.resetGadgetState();
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
  @keyframes dialTick {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(shakeStyle);
