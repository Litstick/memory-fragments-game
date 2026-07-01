/* ===== 故事呈现 ===== */
const Story = {
  phase: 0,  // 0: envelope, 1: text, 2: complete
  storyText: '',
  typewriterTimer: null,

  show(chapterIndex) {
    const chapters = Storage.getChapters();
    const ch = chapters[chapterIndex];
    if (!ch) return;

    this.storyText = ch.story || '';
    this.phase = 0;

    Game.showPage('page-story');

    const container = document.getElementById('story-container');
    const nextBtn = document.getElementById('story-next-btn');

    // 检查是否有视频
    if (ch.video) {
      this.showVideo(ch.video, ch.story);
      return;
    }

    // 信封特效
    this.showEnvelope(container, nextBtn);
  },

  showEnvelope(container, nextBtn) {
    // 预览文字（简短）
    const previewText = this.storyText.substring(0, 100) + (this.storyText.length > 100 ? '...' : '');

    container.innerHTML = `
      <div class="envelope-scene">
        <div class="envelope clickable" id="story-envelope">
          <div class="envelope-body">
            <div class="envelope-letter">${previewText}</div>
            <div class="envelope-flap"></div>
            <div class="envelope-wax"></div>
          </div>
        </div>
        <p style="text-align:center; margin-top:20px; color:var(--color-text-dim); font-size:14px;">
          点击信封拆开
        </p>
      </div>
    `;

    nextBtn.textContent = '打开信封';
    nextBtn.style.display = 'none';

    // 点击信封打开
    setTimeout(() => {
      const envelope = document.getElementById('story-envelope');
      if (envelope) {
        envelope.addEventListener('click', () => {
          envelope.classList.add('open');
          envelope.classList.remove('clickable');
          // 移除点击提示
          const hint = container.querySelector('p');
          if (hint) hint.style.display = 'none';

          // 显示"继续"按钮
          nextBtn.textContent = '阅读信件';
          nextBtn.style.display = 'inline-flex';
          this.phase = 1;
        });
      }
    }, 500);
  },

  showVideo(videoUrl, storyText) {
    const container = document.getElementById('story-container');
    const nextBtn = document.getElementById('story-next-btn');

    container.innerHTML = `
      <div class="story-video">
        <video src="${videoUrl}" controls playsinline>
          您的浏览器不支持视频播放。
        </video>
      </div>
    `;
    nextBtn.textContent = '继续';
    nextBtn.style.display = 'inline-flex';
    this.phase = 2;
  },

  next() {
    const container = document.getElementById('story-container');
    const nextBtn = document.getElementById('story-next-btn');

    if (this.phase === 0) {
      // 打开信封
      const envelope = document.getElementById('story-envelope');
      if (envelope) {
        envelope.classList.add('open');
        envelope.classList.remove('clickable');
      }
      this.phase = 1;
      nextBtn.textContent = '阅读信件';

    } else if (this.phase === 1) {
      // 显示文字内容（打字机效果）
      this.showTypewriter(container, nextBtn);
      this.phase = 2;

    } else if (this.phase === 2) {
      // 完成
      this.showComplete(container, nextBtn);
      this.phase = 3;

    } else {
      // 返回章节选择
      Game.showPage('page-chapters');
    }
  },

  showTypewriter(container, nextBtn) {
    container.innerHTML = `
      <div class="story-text-area" id="story-text-area">
        <div class="story-text-content" id="story-text-content"></div>
      </div>
    `;

    nextBtn.style.display = 'none';

    const textArea = document.getElementById('story-text-area');
    const textContent = document.getElementById('story-text-content');

    setTimeout(() => {
      textArea.classList.add('show');
    }, 100);

    // 打字机效果
    let charIndex = 0;
    const speed = 40; // ms per character
    const text = this.storyText;

    this.typewriterTimer = setInterval(() => {
      if (charIndex < text.length) {
        textContent.innerHTML = text.substring(0, charIndex + 1) + '<span class="typewriter-cursor"></span>';
        charIndex++;

        // 自动滚动
        const storyContainer = document.getElementById('story-container');
        storyContainer.scrollTop = storyContainer.scrollHeight;
      } else {
        clearInterval(this.typewriterTimer);
        textContent.innerHTML = text;
        nextBtn.textContent = '完成';
        nextBtn.style.display = 'inline-flex';
      }
    }, speed);

    // 点击可跳过打字机效果
    textArea.addEventListener('click', () => {
      if (this.typewriterTimer) {
        clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
        textContent.innerHTML = text;
        nextBtn.textContent = '完成';
        nextBtn.style.display = 'inline-flex';
      }
    });
  },

  showComplete(container, nextBtn) {
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }

    container.innerHTML = `
      <div class="story-complete fade-in">
        <h2>章节完成</h2>
        <p>你已成功拼凑出这段记忆碎片</p>
        <p style="margin-top:16px; font-size:24px;">✨</p>
      </div>
    `;

    nextBtn.textContent = '返回章节选择';
    nextBtn.style.display = 'inline-flex';
  }
};
