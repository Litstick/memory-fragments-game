/* ===== 存储管理 ===== */
const Storage = {
  KEYS: {
    CHAPTERS: 'mf_chapters',
    GAME_STATE: 'mf_game_state',
    DEFAULT_IMAGE: 'mf_default_image'
  },

  // 获取章节配置
  getChapters() {
    try {
      const data = localStorage.getItem(this.KEYS.CHAPTERS);
      return data ? JSON.parse(data) : [];
    } catch(e) { return []; }
  },

  // 保存章节配置
  saveChapters(chapters) {
    localStorage.setItem(this.KEYS.CHAPTERS, JSON.stringify(chapters));
  },

  // 获取游戏进度
  getGameState() {
    try {
      const data = localStorage.getItem(this.KEYS.GAME_STATE);
      return data ? JSON.parse(data) : null;
    } catch(e) { return null; }
  },

  // 保存游戏进度
  saveGameState(state) {
    localStorage.setItem(this.KEYS.GAME_STATE, JSON.stringify(state));
  },

  // 清除游戏进度
  clearGameState() {
    localStorage.removeItem(this.KEYS.GAME_STATE);
  },

  // 获取默认图片
  getDefaultImage() {
    return localStorage.getItem(this.KEYS.DEFAULT_IMAGE) || '';
  },

  // 保存默认图片 (base64)
  saveDefaultImage(dataUrl) {
    localStorage.setItem(this.KEYS.DEFAULT_IMAGE, dataUrl);
  },

  // 更新单个章节进度
  updateChapterProgress(chapterIndex, unlockedPieces) {
    const state = this.getGameState() || { chapters: {} };
    if (!state.chapters) state.chapters = {};
    state.chapters[chapterIndex] = { unlockedPieces };
    state.lastPlayTime = Date.now();
    this.saveGameState(state);
  },

  // 获取章节进度
  getChapterProgress(chapterIndex) {
    const state = this.getGameState();
    if (!state || !state.chapters) return [];
    const ch = state.chapters[chapterIndex];
    return ch ? ch.unlockedPieces : [];
  },

  // 标记章节完成
  markChapterComplete(chapterIndex) {
    const state = this.getGameState() || { chapters: {} };
    if (!state.chapters) state.chapters = {};
    if (!state.chapters[chapterIndex]) state.chapters[chapterIndex] = { unlockedPieces: [] };
    state.chapters[chapterIndex].completed = true;
    state.lastPlayTime = Date.now();
    this.saveGameState(state);
  },

  // 检查章节是否已完成
  isChapterComplete(chapterIndex) {
    const state = this.getGameState();
    if (!state || !state.chapters) return false;
    return state.chapters[chapterIndex] && state.chapters[chapterIndex].completed === true;
  }
};
