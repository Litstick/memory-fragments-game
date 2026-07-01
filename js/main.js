/* ===== 主入口 ===== */
document.addEventListener('DOMContentLoaded', () => {
  Game.init();

  // 窗口大小改变时重新渲染拼图
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (Game.currentPage === 'page-game' && Game.currentChapter >= 0) {
        Game.renderPuzzleGrid();
      }
    }, 300);
  });

  // 阻止双击缩放
  document.addEventListener('dblclick', (e) => e.preventDefault());

  // 防止 iOS bounce
  document.body.addEventListener('touchmove', (e) => {
    if (e.target.closest('.modal-body, .settings-body, .chapters-grid, .clue-list, .story-container, .chapter-edit-body')) {
      // 允许滚动区域
    } else {
      // e.preventDefault();
    }
  }, { passive: true });
});
