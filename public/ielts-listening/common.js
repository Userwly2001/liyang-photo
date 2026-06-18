// common.js - 雅思精听通用功能 (数据驱动版)

let currentData = null;       // 当前加载的 section 数据
let currentKey = null;        // 当前 key，如 "C19T1S1"
let currentMistakes = [];     // 错题数组

// 辅助函数：转义HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// 获取完整句子原文（将[blank]替换为______）
function getFullOriginalSentence(sentenceObj, sentenceIdx) {
  let fullText = `${sentenceObj.speaker}: ${sentenceObj.text}`;
  fullText = fullText.replace(/\[blank\]/g, ' ______ ');
  return fullText;
}

// 生成听力易错分析（仅针对填空答案本身）
function getListeningTipForAnswer(answer) {
  const ans = answer.toLowerCase().trim();
  if (!ans) return null;
  if (/\d+(\.\d+)?\s*(acres?|hectares?|years?|£[\d\.]+|pounds?)/.test(ans))
    return "🔢 数字+单位连读易漏：如 '170 acres' 中 acres 尾音 /əz/ 弱化，注意数字后快速衔接单位。";
  if (ans === "rangers" || ans === "classes" || ans === "species" || ans === "requirements")
    return "🔊 复数词尾 /s/ /z/ 在句中常被吞音，需结合上下文判断单复。";
  if (ans.includes("established") || ans === "completed")
    return "🎯 过去分词 '-ed' 发音为 /d/ 或 /t/ 且弱读，拼写容易遗漏 'ed'。";
  if (ans === "compass to navigate")
    return "🧭 短语连读: 'compass to' 中 /tə/ 弱化，'navigate' 重音在 na-，语速快时较难捕捉。";
  if (ans === "£4.95")
    return "💷 价格表达: 'four pounds ninety-five' 中 pounds 与数字连读，且英镑符号提示货币。";
  if (ans === "deer and rabbits")
    return "🦌 并列连读 'deer and rabbits' 中 'and' 弱读成 /ən/，易听成 'deer rabbits'。";
  if (ans === "look forward to hearing from you")
    return "📞 短语连读: 'look forward to' 中 forward to 连续快读，to 轻读且与 hearing 连缀。";
  if (ans.includes("local primary school") || ans.includes("different habitats"))
    return "🏫 形容词+名词组合：注意重音落在名词上，形容词常被弱读。";
  if (ans === "experiment" || ans === "imagine" || ans === "discover")
    return "🎓 动词重音在第二音节，语速快时可能听成类似名词形式。";
  return null;
}

// 渲染主界面：生成带填空的HTML
function renderPractice(sectionData, sectionKey) {
  currentData = sectionData;
  currentKey = sectionKey;
  const container = document.getElementById('transcriptPanel');
  if (!container) return;
  container.innerHTML = '<span class="section-tag">🎧 逐句精听 · 点击👁️填空+翻译</span>';
  
  sectionData.sentences.forEach((sentence, idx) => {
    const sentenceDiv = document.createElement('div');
    sentenceDiv.className = 'sentence';
    sentenceDiv.setAttribute('data-sentence-idx', idx);
    
    // 构建句子内容，替换 [blank] 为输入框
    let processedText = sentence.text;
    let blankCounter = 0;
    processedText = processedText.replace(/\[blank\]/g, () => {
      const answer = sentence.blanks[blankCounter]?.answer || '';
      blankCounter++;
      return `<input type="text" class="blank-input" data-answer="${escapeHtml(answer)}" value="">`;
    });
    
    const speakerSpan = `<span class="speaker">${idx+1}. ${sentence.speaker}:</span>`;
    const wrapper = document.createElement('div');
    wrapper.className = 'sentence-text-wrapper';
    wrapper.innerHTML = `${speakerSpan} ${processedText} <button class="listen-btn" data-idx="${idx}">👁️</button>`;
    sentenceDiv.appendChild(wrapper);
    
    const transDiv = document.createElement('div');
    transDiv.className = 'translation';
    transDiv.id = `trans-${idx}`;
    transDiv.innerText = sentence.translation || '';
    sentenceDiv.appendChild(transDiv);
    
    container.appendChild(sentenceDiv);
  });
  
  // 重新绑定小眼睛按钮事件
  bindSentenceButtons();
  // 重置得分板和错题本
  document.getElementById('result-board').style.display = 'none';
  renderMistakeList([]);
  currentMistakes = [];
}

// 绑定所有句子的精听按钮
function bindSentenceButtons() {
  document.querySelectorAll('.listen-btn').forEach(btn => {
    btn.removeEventListener('click', handleListenClick);
    btn.addEventListener('click', handleListenClick);
  });
}

// 精听单个句子：自动填空+显示翻译
function handleListenClick(e) {
  const btn = e.currentTarget;
  const sentenceDiv = btn.closest('.sentence');
  const idx = parseInt(btn.getAttribute('data-idx'));
  if (isNaN(idx)) return;
  const sentenceData = currentData.sentences[idx];
  if (!sentenceData) return;
  
  // 填充当前句子中的所有输入框
  const inputs = sentenceDiv.querySelectorAll('.blank-input');
  sentenceData.blanks.forEach((blank, i) => {
    if (inputs[i]) {
      inputs[i].value = blank.answer;
      inputs[i].classList.remove('incorrect');
      inputs[i].classList.add('correct');
      const hintSpan = inputs[i].nextElementSibling;
      if (hintSpan && hintSpan.classList && hintSpan.classList.contains('answer-hint')) {
        hintSpan.style.display = 'none';
      }
    }
  });
  // 显示翻译
  const transDiv = sentenceDiv.querySelector('.translation');
  if (transDiv) transDiv.classList.add('show');
  sentenceDiv.style.backgroundColor = '#fffef7';
  setTimeout(() => sentenceDiv.style.backgroundColor = '', 500);
}

// 提交校对 (全部句子)
function validateAnswers() {
  if (!currentData) return;
  let correctCount = 0;
  let totalBlanks = 0;
  const mistakes = [];
  
  const sentenceDivs = document.querySelectorAll('.sentence');
  sentenceDivs.forEach((sentenceDiv, sIdx) => {
    const sentenceData = currentData.sentences[sIdx];
    if (!sentenceData) return;
    const inputs = sentenceDiv.querySelectorAll('.blank-input');
    totalBlanks += inputs.length;
    sentenceData.blanks.forEach((blank, bIdx) => {
      const input = inputs[bIdx];
      if (!input) return;
      const userVal = input.value.trim().toLowerCase().replace(/[.,?!£]/g, '');
      const correctVal = blank.answer.toLowerCase().replace(/[.,?!£]/g, '');
      const hintSpan = input.nextElementSibling;
      if (userVal === correctVal && userVal !== "") {
        input.classList.add('correct');
        input.classList.remove('incorrect');
        if (hintSpan && hintSpan.classList.contains('answer-hint')) hintSpan.style.display = 'none';
        correctCount++;
      } else {
        input.classList.add('incorrect');
        input.classList.remove('correct');
        if (hintSpan && hintSpan.classList.contains('answer-hint')) {
          hintSpan.textContent = ` [${blank.answer}]`;
          hintSpan.style.display = 'inline';
        } else if (!hintSpan || !hintSpan.classList) {
          // 如果没有提示span，创建一个
          const newHint = document.createElement('span');
          newHint.className = 'answer-hint';
          newHint.textContent = ` [${blank.answer}]`;
          input.parentNode.insertBefore(newHint, input.nextSibling);
        }
        // 记录错题
        const fullSentence = getFullOriginalSentence(sentenceData, sIdx);
        mistakes.push({
          fullSentence: fullSentence,
          wrongAnswer: input.value.trim() || '（未填写）',
          correctAnswer: blank.answer
        });
      }
    });
  });
  
  const board = document.getElementById('result-board');
  board.style.display = 'block';
  board.innerHTML = `🎯 得分: ${correctCount} / ${totalBlanks}`;
  board.style.color = correctCount === totalBlanks ? '#2E7D32' : '#C62828';
  
  renderMistakeList(mistakes);
  currentMistakes = mistakes;
}

// 渲染错题本（底部）
function renderMistakeList(mistakes) {
  currentMistakes = mistakes;
  const container = document.getElementById('mistakeListContainerBottom');
  if (!container) return;
  if (mistakes.length === 0) {
    container.innerHTML = '<div class="empty-mistake">🎉 太棒了！暂无错题，继续保持听力训练～</div>';
    return;
  }
  let html = '';
  mistakes.forEach(mist => {
    const tip = getListeningTipForAnswer(mist.correctAnswer);
    html += `
      <div class="mistake-item">
        <div class="mistake-quote">📌 完整原文：${escapeHtml(mist.fullSentence)}</div>
        <div class="mistake-detail">
          <span>❌ 你的答案: <span class="wrong-ans">${escapeHtml(mist.wrongAnswer)}</span></span>
          <span>✅ 正确答案: <span class="right-ans">${escapeHtml(mist.correctAnswer)}</span></span>
        </div>
        ${tip ? `<div class="analysis-tip" style="margin-top:8px; background:#e9f0f5; padding:6px; border-radius:10px;"><strong>🎧 听力易错聚焦：</strong> ${escapeHtml(tip)}</div>` : ''}
      </div>
    `;
  });
  container.innerHTML = html;
}

// 重置当前练习
function resetExercise() {
  const allInputs = document.querySelectorAll('.blank-input');
  allInputs.forEach(input => {
    input.value = '';
    input.classList.remove('correct', 'incorrect');
    const hint = input.nextElementSibling;
    if (hint && hint.classList && hint.classList.contains('answer-hint')) hint.style.display = 'none';
  });
  document.querySelectorAll('.translation').forEach(trans => trans.classList.remove('show'));
  const board = document.getElementById('result-board');
  if (board) board.style.display = 'none';
  renderMistakeList([]);
  currentMistakes = [];
}

// 一键原文精听：填充所有空 + 显示所有翻译 + 自动播放音频
function fullOriginalListen() {
  const allInputs = document.querySelectorAll('.blank-input');
  const sentenceDivs = document.querySelectorAll('.sentence');
  sentenceDivs.forEach((sentenceDiv, idx) => {
    const sentenceData = currentData?.sentences[idx];
    if (!sentenceData) return;
    const inputs = sentenceDiv.querySelectorAll('.blank-input');
    sentenceData.blanks.forEach((blank, i) => {
      if (inputs[i]) {
        inputs[i].value = blank.answer;
        inputs[i].classList.add('correct');
        inputs[i].classList.remove('incorrect');
        const hintSpan = inputs[i].nextElementSibling;
        if (hintSpan && hintSpan.classList.contains('answer-hint')) hintSpan.style.display = 'none';
      }
    });
    const transDiv = sentenceDiv.querySelector('.translation');
    if (transDiv) transDiv.classList.add('show');
  });
  // 播放音频（如果已经上传）
  const audioPlayer = document.getElementById('audio-player');
  if (audioPlayer && audioPlayer.src && audioPlayer.src !== '') {
    audioPlayer.play().catch(e => console.warn("播放失败，请确保音频已加载"));
  } else {
    alert("请先上传本地音频文件（点击「上传本地音频」按钮）");
  }
}

// 导出错题笔记
function exportMistakeNotes() {
  if (currentMistakes.length === 0) {
    alert('📭 当前没有错题记录，请先提交校对产生错题。');
    return;
  }
  let content = `📖 雅思精听错题本 (完整原文+听力分析) ${new Date().toLocaleString()}\n`;
  content += `=========================================\n\n`;
  currentMistakes.forEach((m, i) => {
    const tip = getListeningTipForAnswer(m.correctAnswer);
    content += `【错题 ${i+1}】\n`;
    content += `📌 完整原文: ${m.fullSentence}\n`;
    content += `❌ 你的答案: ${m.wrongAnswer}\n`;
    content += `✅ 正确答案: ${m.correctAnswer}\n`;
    if (tip) content += `🎧 听力注意事项: ${tip}\n`;
    content += `-----------------------------------------\n\n`;
  });
  content += `📌 提示：反复精听错题对应句子，关注填空词汇的连读弱读及重音。`;
  const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `雅思错题本_${new Date().toISOString().slice(0,19)}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// 清空错题本UI
function clearMistakesUI() {
  renderMistakeList([]);
  currentMistakes = [];
}

// 绑定全局按钮和键盘事件 (在页面加载后调用)
function bindGlobalEvents() {
  const submitBtn = document.getElementById('submitBtn');
  const resetBtn = document.getElementById('resetBtn');
  const fullListenBtn = document.getElementById('fullListenBtn');
  const clearMistakeBtn = document.getElementById('clearMistakeBtnBottom');
  const exportBtn = document.getElementById('exportMistakeBtnBottom');
  if (submitBtn) submitBtn.onclick = validateAnswers;
  if (resetBtn) resetBtn.onclick = resetExercise;
  if (fullListenBtn) fullListenBtn.onclick = fullOriginalListen;
  if (clearMistakeBtn) clearMistakeBtn.onclick = clearMistakesUI;
  if (exportBtn) exportBtn.onclick = exportMistakeNotes;
  
  // 音频上传和键盘快捷键（与原版一致）
  const fileInput = document.getElementById('file-input');
  const audioPlayer = document.getElementById('audio-player');
  if (fileInput) {
    fileInput.onchange = function(e) {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        audioPlayer.src = url;
        audioPlayer.play().catch(e=>console.log);
      }
    };
  }
  window.addEventListener('keydown', function(e) {
    const activeEl = document.activeElement;
    const isInputFocused = activeEl && activeEl.tagName === 'INPUT';
    if (e.key === 'Enter') {
      e.preventDefault();
      if (audioPlayer.paused) audioPlayer.play(); else audioPlayer.pause();
    }
    if (e.key === 'Shift') {
      e.preventDefault();
      const inputsArr = document.querySelectorAll('.blank-input');
      const idx = Array.from(inputsArr).indexOf(activeEl);
      if (idx > -1) {
        const nextIdx = (idx + 1) % inputsArr.length;
        inputsArr[nextIdx].focus();
      } else if (inputsArr.length) inputsArr[0].focus();
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if (isInputFocused && !e.altKey) return;
      e.preventDefault();
      if (audioPlayer.src) {
        let delta = e.key === 'ArrowLeft' ? -5 : 5;
        let newTime = audioPlayer.currentTime + delta;
        newTime = Math.max(0, Math.min(audioPlayer.duration || 0, newTime));
        audioPlayer.currentTime = newTime;
      }
    }
  });
}