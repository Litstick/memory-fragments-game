/* ===== 谜题类型定义 ===== */
const PuzzleTypes = {
  types: {
    text: { name: '文字问答', desc: '直接回答问题' },
    password: { name: '密码破解', desc: '根据提示输入密码' },
    cipher: { name: '凯撒密码', desc: '解密移位后的文字' },
    reverse: { name: '倒序文字', desc: '将倒序的文字还原' },
    riddle: { name: '谜语', desc: '猜谜底' },
    math: { name: '数学题', desc: '计算结果' }
  },

  getTypeName(type) {
    return this.types[type] ? this.types[type].name : type;
  },

  // 验证答案
  validate(puzzle, userAnswer) {
    if (!userAnswer.trim()) return false;
    const answer = puzzle.answer.trim().toLowerCase();
    const input = userAnswer.trim().toLowerCase();

    switch(puzzle.type) {
      case 'text':
      case 'password':
      case 'riddle':
        return input === answer;

      case 'cipher': {
        // 尝试所有可能的凯撒位移来检查
        for (let shift = 1; shift <= 25; shift++) {
          const decoded = this.caesarDecode(answer, shift);
          if (decoded === input) return true;
        }
        // 也直接比较
        return input === answer;
      }

      case 'reverse': {
        const reversed = answer.split('').reverse().join('');
        return input === reversed || input === answer;
      }

      case 'math': {
        // 允许数字比较
        const a = parseFloat(input);
        const b = parseFloat(answer);
        if (!isNaN(a) && !isNaN(b)) return Math.abs(a - b) < 0.001;
        return input === answer;
      }

      default:
        return input === answer;
    }
  },

  // 凯撒解码
  caesarDecode(text, shift) {
    return text.split('').map(ch => {
      if (ch >= 'a' && ch <= 'z') {
        return String.fromCharCode(((ch.charCodeAt(0) - 97 - shift + 26) % 26) + 97);
      }
      if (ch >= 'A' && ch <= 'Z') {
        return String.fromCharCode(((ch.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
      }
      return ch;
    }).join('');
  },

  // 获取谜题提示文本
  getHintText(puzzle) {
    if (puzzle.hint) return puzzle.hint;
    switch(puzzle.type) {
      case 'cipher':
        return '提示：这是一段凯撒密码，每个字母都向后移动了固定的位数。试试移位1-5。';
      case 'reverse':
        return '提示：文字被倒序了，试着从后往前读。';
      case 'math':
        return '提示：仔细计算，注意运算优先级。';
      default:
        return '';
    }
  },

  // 渲染谜题问题（为不同类型增加说明）
  renderQuestion(puzzle) {
    let extra = '';
    switch(puzzle.type) {
      case 'cipher':
        extra = `<div style="margin-top:8px;font-size:13px;color:var(--color-text-dim);">
          这段密文需要用凯撒密码解密。每个字母都向后移动了固定的位数。
        </div>`;
        break;
      case 'reverse':
        extra = `<div style="margin-top:8px;font-size:13px;color:var(--color-text-dim);">
          这段文字被倒序排列了，请还原成正确的顺序。
        </div>`;
        break;
    }
    return `<div class="puzzle-question">${puzzle.question}${extra}</div>`;
  }
};
