import * as vscode from 'vscode';

class TicTacToeViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'tictactoe.gameView';

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = getWebviewContent();

        webviewView.webview.onDidReceiveMessage((message: { type: string; payload?: { winner: string } }) => {
            if (message.type === 'gameOver' && message.payload) {
                const w = message.payload.winner;
                const text =
                    w === 'X' ? '🎉 You win! Congratulations!' :
                    w === 'O' ? '🤖 AI wins this round!' :
                    "🤝 It's a draw!";
                vscode.window.showInformationMessage(text);
            }
        });
    }
}

export function activate(context: vscode.ExtensionContext): void {
    const provider = new TicTacToeViewProvider();
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            TicTacToeViewProvider.viewType,
            provider,
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );
}

export function deactivate(): void {}

// ---------------------------------------------------------------------------
// Webview content
// ---------------------------------------------------------------------------

function getWebviewContent(): string {
    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<title>Tic Tac Toe</title>
<style>
/* =====================================================
   RESET & VARIABLES
   ===================================================== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
    --bg:        #0d0d1a;
    --surface:   #161628;
    --surface2:  #1e1e38;
    --border:    #2a2a4a;

    --x:         #e94560;
    --x-glow:    rgba(233,69,96,0.35);
    --o:         #00c9a7;
    --o-glow:    rgba(0,201,167,0.30);
    --accent:    #7c4dff;
    --accent2:   #b388ff;
    --gold:      #ffd700;

    --text:      #dde1f5;
    --muted:     #6b6b8a;

    --cell:      clamp(72px, 25vw, 98px);
    --gap:       5px;
    --board:     calc(3 * var(--cell) + 2 * var(--gap));
    --radius:    13px;
}

body {
    background: var(--bg);
    color: var(--text);
    font-family: system-ui, -apple-system, sans-serif;
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 20px 12px 32px;
    background-image:
        radial-gradient(ellipse at 15% 15%, rgba(124,77,255,.13) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 85%, rgba(0,201,167,.09) 0%, transparent 55%);
}

/* =====================================================
   DIFFICULTY SCREEN
   ===================================================== */
#difficulty-screen {
    position: fixed;
    inset: 0;
    background: var(--bg);
    background-image:
        radial-gradient(ellipse at 15% 15%, rgba(124,77,255,.13) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 85%, rgba(0,201,167,.09) 0%, transparent 55%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    z-index: 100;
}

#difficulty-screen h2 {
    font-family: 'Courier New', monospace;
    font-size: clamp(1.4rem, 6vw, 2rem);
    font-weight: 900;
    letter-spacing: 2px;
    color: var(--text);
    text-align: center;
}

#difficulty-screen p {
    color: var(--muted);
    font-size: .82rem;
    text-align: center;
    max-width: 220px;
    line-height: 1.5;
}

.diff-btns {
    display: flex;
    gap: 14px;
    margin-top: 4px;
}

.btn-easy {
    background: linear-gradient(135deg, #00c9a7, #007c67);
    box-shadow: 0 4px 16px rgba(0,201,167,.4);
}
.btn-easy:hover {
    box-shadow: 0 6px 22px rgba(0,201,167,.55);
}

.btn-hard {
    background: linear-gradient(135deg, #e94560, #8b1a2e);
    box-shadow: 0 4px 16px rgba(233,69,96,.4);
}
.btn-hard:hover {
    box-shadow: 0 6px 22px rgba(233,69,96,.55);
}

.diff-badge {
    font-size: .65rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    opacity: .75;
    display: block;
    margin-top: 2px;
}

/* =====================================================
   LAYOUT
   ===================================================== */
.wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    width: 100%;
    max-width: 340px;
}

/* =====================================================
   HEADER
   ===================================================== */
.header { text-align: center; }

.title {
    font-size: clamp(1.5rem, 7vw, 2.2rem);
    font-family: 'Courier New', monospace;
    font-weight: 900;
    letter-spacing: 3px;
    animation: hdrPulse 5s ease-in-out infinite;
}
.tx { color: var(--x); }
.sep { color: var(--muted); font-size: 60%; vertical-align: middle; }
.to { color: var(--o); }

@keyframes hdrPulse {
    0%,100% { opacity:1; }
    50%      { opacity:.75; }
}

.subtitle {
    color: var(--muted);
    font-size: .78rem;
    margin-top: 4px;
    letter-spacing: .3px;
}
.subtitle strong { color: var(--x); }

/* =====================================================
   SCOREBOARD
   ===================================================== */
.scores {
    display: flex;
    gap: 8px;
    width: 100%;
    justify-content: center;
}

.sc {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 6px;
    text-align: center;
    transition: transform .2s;
}
.sc:hover { transform: translateY(-2px); }
.sc-x  { border-top: 3px solid var(--x); }
.sc-d  { border-top: 3px solid var(--accent); }
.sc-o  { border-top: 3px solid var(--o); }

.sc-lbl {
    font-size: .68rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
}
.sc-val {
    font-size: 1.7rem;
    font-weight: 800;
    font-family: 'Courier New', monospace;
    transition: transform .15s;
}
.sc-x .sc-val { color: var(--x); }
.sc-o .sc-val { color: var(--o); }
.sc-d .sc-val { color: var(--accent2); }

/* =====================================================
   STATUS
   ===================================================== */
.status-wrap {
    min-height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
}

.status {
    font-size: .85rem;
    font-weight: 600;
    padding: 6px 18px;
    border-radius: 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    text-align: center;
    opacity: 0;
    transform: translateY(-5px);
}
.status.in { animation: statusIn .3s ease forwards; }

@keyframes statusIn {
    to { opacity:1; transform:translateY(0); }
}

.status.s-win  { color:var(--x);      border-color:var(--x);      background:rgba(233,69,96,.1); }
.status.s-lose { color:var(--o);      border-color:var(--o);      background:rgba(0,201,167,.1); }
.status.s-draw { color:var(--accent2);border-color:var(--accent);  background:rgba(124,77,255,.1); }
.status.s-think{ color:var(--muted);  animation: statusIn .3s ease forwards, blink 1s ease infinite; }

@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.45} }

/* =====================================================
   BOARD CONTAINER (positions SVG overlay)
   ===================================================== */
.board-wrap {
    position: relative;
    width: var(--board);
    height: var(--board);
    flex-shrink: 0;
}

/* =====================================================
   GRID
   ===================================================== */
.board {
    display: grid;
    grid-template-columns: repeat(3, var(--cell));
    grid-template-rows:    repeat(3, var(--cell));
    gap: var(--gap);
    position: relative;
    z-index: 1;
}

/* =====================================================
   CELLS
   ===================================================== */
.cell {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(1.6rem, 6vw, 2.4rem);
    font-family: 'Courier New', monospace;
    font-weight: 900;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition:
        background .2s, border-color .2s,
        transform .15s, box-shadow .2s;
    user-select: none;
}

/* Shimmer hover on empty cells */
.cell:not(.taken)::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,
        transparent 30%, rgba(255,255,255,.06) 50%, transparent 70%);
    transform: translateX(-110%);
    transition: transform .45s ease;
}
.cell:not(.taken):hover::before { transform: translateX(110%); }
.cell:not(.taken):hover {
    background: var(--surface2);
    border-color: var(--accent);
    transform: scale(1.05);
    box-shadow: 0 0 18px rgba(124,77,255,.3);
}

/* X cell */
.cx {
    color: var(--x);
    background: rgba(233,69,96,.07);
    border-color: rgba(233,69,96,.45);
    box-shadow: 0 0 12px var(--x-glow);
    cursor: default;
}
/* O cell */
.co {
    color: var(--o);
    background: rgba(0,201,167,.07);
    border-color: rgba(0,201,167,.4);
    box-shadow: 0 0 12px var(--o-glow);
    cursor: default;
}
/* Taken (no hover) */
.taken { cursor: default; }

/* Pop animation */
.pop { animation: pop .28s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes pop {
    0%  { transform:scale(.55); opacity:0; }
    65% { transform:scale(1.18); }
    100%{ transform:scale(1);   opacity:1; }
}

/* Winner pulse */
.winner { animation: winPulse .75s ease-in-out infinite alternate; }
@keyframes winPulse {
    from { box-shadow:0 0  8px var(--gold); border-color:var(--gold); }
    to   { box-shadow:0 0 28px var(--gold), 0 0 55px var(--gold);
           border-color:var(--gold); background:rgba(255,215,0,.06); }
}

/* =====================================================
   WIN LINE SVG
   ===================================================== */
.win-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
    opacity: 0;
    transition: opacity .25s ease;
}
.win-svg.show { opacity: 1; }

#wl {
    stroke: var(--gold);
    stroke-width: 7;
    stroke-linecap: round;
    filter: drop-shadow(0 0 6px var(--gold));
    stroke-dasharray: 600;
    stroke-dashoffset: 600;
}
#wl.draw { animation: drawLine .5s ease .08s forwards; }
@keyframes drawLine { to { stroke-dashoffset: 0; } }

/* =====================================================
   BUTTON
   ===================================================== */
.btn {
    padding: 10px 28px;
    border: none;
    border-radius: 10px;
    font-size: .9rem;
    font-weight: 700;
    cursor: pointer;
    background: linear-gradient(135deg, var(--accent), #5e35b1);
    color: #fff;
    box-shadow: 0 4px 16px rgba(124,77,255,.4);
    letter-spacing: .4px;
    transition: transform .15s, filter .15s, box-shadow .15s;
}
.btn:hover  { transform:translateY(-2px); filter:brightness(1.12);
              box-shadow:0 6px 22px rgba(124,77,255,.55); }
.btn:active { transform:translateY(0);    filter:brightness(.94); }
</style>
</head>
<body>

<!-- Difficulty selection screen -->
<div id="difficulty-screen">
  <h2>Choose Difficulty</h2>
  <p>How tough do you want the AI to be?</p>
  <div class="diff-btns">
    <button class="btn btn-easy" id="btn-easy">
      Easy
      <span class="diff-badge">beatable</span>
    </button>
    <button class="btn btn-hard" id="btn-hard">
      Hard
      <span class="diff-badge">unbeatable</span>
    </button>
  </div>
</div>

<div class="wrap">

  <!-- Header -->
  <div class="header">
    <h1 class="title">
      <span class="tx">Player</span>
      <span class="sep"> vs </span>
      <span class="to">AI</span>
    </h1>
    <p class="subtitle">You are <strong>Player</strong> &mdash; you go first</p>
  </div>

  <!-- Scoreboard -->
  <div class="scores">
    <div class="sc sc-x">
      <div class="sc-lbl">Player</div>
      <div class="sc-val" id="sx">0</div>
    </div>
    <div class="sc sc-d">
      <div class="sc-lbl">Draw</div>
      <div class="sc-val" id="sd">0</div>
    </div>
    <div class="sc sc-o">
      <div class="sc-lbl">AI</div>
      <div class="sc-val" id="so">0</div>
    </div>
  </div>

  <!-- Status -->
  <div class="status-wrap">
    <div class="status" id="status"></div>
  </div>

  <!-- Board -->
  <div class="board-wrap">
    <div class="board" id="board">
      <div class="cell" data-i="0"></div>
      <div class="cell" data-i="1"></div>
      <div class="cell" data-i="2"></div>
      <div class="cell" data-i="3"></div>
      <div class="cell" data-i="4"></div>
      <div class="cell" data-i="5"></div>
      <div class="cell" data-i="6"></div>
      <div class="cell" data-i="7"></div>
      <div class="cell" data-i="8"></div>
    </div>

    <!-- SVG win line overlay — viewBox matches the board pixel dimensions dynamically -->
    <svg class="win-svg" id="win-svg" viewBox="0 0 306 306"
         xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <line id="wl" x1="0" y1="0" x2="0" y2="0"/>
    </svg>
  </div>

  <!-- Reset -->
  <button class="btn" id="btn-reset">New Game</button>

</div>

<script>
(function () {
    'use strict';

    // VS Code API bridge
    const vscode = (typeof acquireVsCodeApi !== 'undefined')
        ? acquireVsCodeApi() : { postMessage: () => {} };

    // ── Constants ──────────────────────────────────────────────
    const H = 'X', AI = 'O';

    const LINES = [
        [0,1,2],[3,4,5],[6,7,8],   // rows
        [0,3,6],[1,4,7],[2,5,8],   // cols
        [0,4,8],[2,4,6]            // diags
    ];

    // Win-line coordinates in the 306×306 SVG viewBox.
    // Each cell is 98px with 5px gaps → total = 3*98 + 2*5 = 304, padded to 306.
    // Cell centres: 49, 152, 255  (half-cell = 49, step = 103)
    const COORDS = {
        '0,1,2': [10,49,  296,49 ],
        '3,4,5': [10,152, 296,152],
        '6,7,8': [10,255, 296,255],
        '0,3,6': [49,10,  49, 296],
        '1,4,7': [152,10, 152,296],
        '2,5,8': [255,10, 255,296],
        '0,4,8': [10,10,  296,296],
        '2,4,6': [296,10, 10, 296],
    };

    // ── State ──────────────────────────────────────────────────
    let board      = Array(9).fill(null);
    let over       = false;
    let scores     = { X: 0, O: 0, D: 0 };
    let difficulty = null;   // 'easy' | 'hard'

    // ── DOM refs ───────────────────────────────────────────────
    const cells          = [...document.querySelectorAll('.cell')];
    const statusEl       = document.getElementById('status');
    const sxEl           = document.getElementById('sx');
    const soEl           = document.getElementById('so');
    const sdEl           = document.getElementById('sd');
    const winSvg         = document.getElementById('win-svg');
    const wlEl           = document.getElementById('wl');
    const btnReset       = document.getElementById('btn-reset');
    const diffScreen     = document.getElementById('difficulty-screen');
    const btnEasy        = document.getElementById('btn-easy');
    const btnHard        = document.getElementById('btn-hard');
    const wrap           = document.querySelector('.wrap');

    // ── Minimax helpers ────────────────────────────────────────
    function winner(b) {
        for (const [a, m, c] of LINES)
            if (b[a] && b[a] === b[m] && b[a] === b[c]) return b[a];
        return null;
    }

    function winLine(b) {
        for (const line of LINES) {
            const [a, m, c] = line;
            if (b[a] && b[a] === b[m] && b[a] === b[c]) return line;
        }
        return null;
    }

    function full(b) { return b.every(v => v !== null); }

    // ── Hard AI: Minimax with Alpha-Beta Pruning (unbeatable) ──
    function minimax(b, maxing, depth, alpha, beta) {
        const w = winner(b);
        if (w === AI) return 10 - depth;
        if (w === H)  return depth - 10;
        if (full(b))  return 0;

        if (maxing) {
            let best = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (!b[i]) {
                    b[i] = AI;
                    best = Math.max(best, minimax(b, false, depth+1, alpha, beta));
                    b[i] = null;
                    alpha = Math.max(alpha, best);
                    if (beta <= alpha) break;
                }
            }
            return best;
        } else {
            let best = +Infinity;
            for (let i = 0; i < 9; i++) {
                if (!b[i]) {
                    b[i] = H;
                    best = Math.min(best, minimax(b, true, depth+1, alpha, beta));
                    b[i] = null;
                    beta = Math.min(beta, best);
                    if (beta <= alpha) break;
                }
            }
            return best;
        }
    }

    function bestMoveHard(b) {
        if (b.every(v => !v)) return 4;   // fast path: empty → centre
        let best = -Infinity, move = -1;
        for (let i = 0; i < 9; i++) {
            if (!b[i]) {
                b[i] = AI;
                const s = minimax(b, false, 0, -Infinity, +Infinity);
                b[i] = null;
                if (s > best) { best = s; move = i; }
            }
        }
        return move;
    }

    // ── Easy AI: strategic but makes deliberate blunders ──────
    function bestMoveEasy(b) {
        const empties = b.map((v, i) => v ? null : i).filter(i => i !== null);

        // 1. Take a winning move — but only 70% of the time (miss it 30%)
        for (const i of empties) {
            b[i] = AI;
            const wins = winner(b) === AI;
            b[i] = null;
            if (wins && Math.random() < 0.70) return i;
        }

        // 2. Block player's winning move — but only 60% of the time
        for (const i of empties) {
            b[i] = H;
            const blocks = winner(b) === H;
            b[i] = null;
            if (blocks && Math.random() < 0.60) return i;
        }

        // 3. 40% of the time just pick a random empty cell
        if (Math.random() < 0.40) {
            return empties[Math.floor(Math.random() * empties.length)];
        }

        // 4. Otherwise prefer center → corners → edges
        const preferred = [4, 0, 2, 6, 8, 1, 3, 5, 7];
        return preferred.find(i => !b[i]);
    }

    // ── AI move dispatcher ────────────────────────────────────
    function bestMove(b) {
        return difficulty === 'hard' ? bestMoveHard(b) : bestMoveEasy(b);
    }

    // ── Render ─────────────────────────────────────────────────
    function render() {
        cells.forEach((el, i) => {
            el.textContent = board[i] ?? '';
            el.className = 'cell';
            if (board[i] === H)   el.classList.add('cx');
            if (board[i] === AI)  el.classList.add('co');
            if (board[i] || over) el.classList.add('taken');
        });
    }

    function setStatus(msg, cls = '') {
        statusEl.className = 'status' + (cls ? ' ' + cls : '');
        statusEl.textContent = msg;
        // Re-trigger slide-in animation
        void statusEl.offsetWidth;
        statusEl.classList.add('in');
    }

    function bumpScore(el) {
        el.style.transform = 'scale(1.4)';
        setTimeout(() => { el.style.transform = ''; }, 250);
    }

    function showWinLine(line) {
        const key = line.join(',');
        const c = COORDS[key];
        if (!c) return;
        wlEl.setAttribute('x1', c[0]);
        wlEl.setAttribute('y1', c[1]);
        wlEl.setAttribute('x2', c[2]);
        wlEl.setAttribute('y2', c[3]);
        winSvg.classList.add('show');
        wlEl.classList.remove('draw');
        void wlEl.offsetWidth;
        wlEl.classList.add('draw');
    }

    function hideWinLine() {
        winSvg.classList.remove('show');
        wlEl.classList.remove('draw');
    }

    // ── Difficulty screen ──────────────────────────────────────
    function showDifficultyScreen() {
        diffScreen.style.display = 'flex';
        wrap.style.visibility = 'hidden';
    }

    function hideDifficultyScreen() {
        diffScreen.style.display = 'none';
        wrap.style.visibility = 'visible';
    }

    // ── Game flow ──────────────────────────────────────────────
    function playerMove(i) {
        if (over || board[i] || difficulty === null) return;

        board[i] = H;
        cells[i].classList.add('pop');
        render();

        const w = winner(board);
        if (w)          { endGame(w); return; }
        if (full(board)){ endGame(null); return; }

        over = true;   // block input during AI turn
        setStatus('AI is thinking\u2026', 's-think');

        setTimeout(() => {
            over = false;
            const ai = bestMove(board);
            board[ai] = AI;
            cells[ai].classList.add('pop');
            render();

            const w2 = winner(board);
            if (w2)          { endGame(w2); }
            else if (full(board)) { endGame(null); }
            else { setStatus('Your turn \u2014 make your move'); }
        }, 320);
    }

    function endGame(w) {
        over = true;
        const line = winLine(board);
        if (line) {
            line.forEach(i => cells[i].classList.add('winner'));
            showWinLine(line);
        }
        cells.forEach(c => c.classList.add('taken'));

        if (w === H) {
            scores.X++;
            sxEl.textContent = scores.X;
            bumpScore(sxEl);
            setStatus('You win! \uD83C\uDF89', 's-win');
        } else if (w === AI) {
            scores.O++;
            soEl.textContent = scores.O;
            bumpScore(soEl);
            setStatus('AI wins this round!', 's-lose');
        } else {
            scores.D++;
            sdEl.textContent = scores.D;
            bumpScore(sdEl);
            setStatus("It\u2019s a draw!", 's-draw');
        }

        vscode.postMessage({ type: 'gameOver', payload: { winner: w ?? 'draw' } });
    }

    function startGame(diff) {
        difficulty = diff;
        hideDifficultyScreen();
        board = Array(9).fill(null);
        over  = false;
        hideWinLine();
        render();
        setStatus('Your turn \u2014 make your move');
    }

    function reset() {
        showDifficultyScreen();
    }

    // ── Events ─────────────────────────────────────────────────
    cells.forEach((el, i) => el.addEventListener('click', () => playerMove(i)));
    btnReset.addEventListener('click', reset);
    btnEasy.addEventListener('click', () => startGame('easy'));
    btnHard.addEventListener('click', () => startGame('hard'));

    // ── Init ───────────────────────────────────────────────────
    showDifficultyScreen();
    render();
    setStatus('');
})();
</script>
</body>
</html>`;
}
