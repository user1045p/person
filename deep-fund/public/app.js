const logDiv = document.getElementById('log');
const statusDiv = document.getElementById('status');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const urlsInput = document.getElementById('urls');

const MAX_ITEMS = 300;

const socket = new WebSocket(`ws://${location.host}/ws`);

socket.onopen = () => statusDiv.textContent = '✅ 已连接';
socket.onclose = () => statusDiv.textContent = '❌ 已断开';
socket.onerror = () => statusDiv.textContent = '⚠️ 连接错误';

socket.onmessage = (e) => {
  const item = JSON.parse(e.data);
  const el = document.createElement('div');
  el.className = 'log-item';
  el.innerHTML = `<span class="time">${new Date().toLocaleTimeString()}</span>
                  <span class="url">${escHtml(item.url)}</span>
                  <span>${escHtml(item.title)}</span>`;
  logDiv.prepend(el);
  while (logDiv.children.length > MAX_ITEMS) logDiv.lastChild.remove();
};

function escHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  }[c]));
}

startBtn.onclick = () => {
  const urls = urlsInput.value.split('\n').map(s => s.trim()).filter(Boolean);
  if (!urls.length) return alert('请输入网址');
  socket.send(JSON.stringify({ action: 'start', payload: { urls } }));
  statusDiv.textContent = '⏳ 爬取中...';
};

stopBtn.onclick = () => {
  socket.send(JSON.stringify({ action: 'stop' }));
  statusDiv.textContent = '⏹️ 已停止';
};