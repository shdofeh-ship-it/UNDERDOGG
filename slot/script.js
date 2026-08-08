// --- КИБЕР АУДИОСИСТЕМА (WEB AUDIO API) ---
class CyberAudio {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playClick() {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playSpinSound() {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 1.2);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 1.2);
    }

    playWinSound() {
        if (this.muted) return;
        this.init();
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + index * 0.1);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime + index * 0.1);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + index * 0.1 + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + index * 0.1);
            osc.stop(this.ctx.currentTime + index * 0.1 + 0.4);
        });
    }

    playBonusSound() {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.8);
    }
}

const audio = new CyberAudio();

// --- ИГРОВОЕ СОСТОЯНИЕ ---
const gameState = {
    balance: 100000.00,
    bet: 100.00,
    multiplier: 5,
    freeSpins: 12,
    level: 3,
    win: 0.00,
    isSpinning: false
};

const symbolsPool = ['🐺', '⚡', '👑', '🅰️', '💼', '💳', '🎧', '🔟', '🥷', '💻', '💰', '🔥WILD🔥'];

function getRandomSymbol() {
    return symbolsPool[Math.floor(Math.random() * symbolsPool.length)];
}

const spinBtn = document.getElementById('spinBtn');
const soundToggle = document.getElementById('sound-toggle');
const balanceEl = document.querySelector('.balance-box .stat-number');
const winEl = document.querySelector('.win-box .stat-number');
const freeSpinsEl = document.querySelector('.sidebar-left .stat-box:nth-child(2) .stat-value');
const multiplierEl = document.querySelector('.sidebar-left .stat-box:nth-child(1) .stat-value');

function updateUI() {
    balanceEl.textContent = `₱${gameState.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    winEl.textContent = `₱${gameState.win.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    freeSpinsEl.textContent = gameState.freeSpins;
    multiplierEl.textContent = `X${gameState.multiplier}`;
}

soundToggle.addEventListener('click', () => {
    audio.muted = !audio.muted;
    soundToggle.textContent = audio.muted ? '🔇' : '🔊';
    audio.playClick();
});

document.getElementById('bet-minus').addEventListener('click', () => {
    if (gameState.isSpinning) return;
    audio.playClick();
    if (gameState.bet > 10) gameState.bet -= 10;
    document.querySelector('.bet-val').textContent = `₱${gameState.bet.toFixed(2)}`;
});

document.getElementById('bet-plus').addEventListener('click', () => {
    if (gameState.isSpinning) return;
    audio.playClick();
    gameState.bet += 10;
    document.querySelector('.bet-val').textContent = `₱${gameState.bet.toFixed(2)}`;
});

// --- МЕХАНИКА СПИНА И БОНУСОВ ---
spinBtn.addEventListener('click', () => {
    if (gameState.isSpinning) return;

    if (gameState.freeSpins <= 0 && gameState.balance < gameState.bet) {
        alert('Недостаточно средств на балансе!');
        return;
    }

    if (gameState.freeSpins > 0) {
        gameState.freeSpins--;
    } else {
        gameState.balance -= gameState.bet;
    }

    gameState.isSpinning = true;
    gameState.win = 0.00;
    updateUI();

    audio.playClick();
    audio.playSpinSound();

    const tracks = document.querySelectorAll('.reel-track');
    const finalMatrix = [];

    tracks.forEach((track, index) => {
        const colSymbols = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
        finalMatrix.push(colSymbols);

        let htmlContent = '';
        for (let i = 0; i < 12; i++) {
            htmlContent += `<span>${getRandomSymbol()}</span>`;
        }
        htmlContent += `<span>${colSymbols[0]}</span><span>${colSymbols[1]}</span><span>${colSymbols[2]}</span>`;
        
        track.innerHTML = htmlContent;
        track.style.transition = 'none';
        track.style.transform = 'translateY(0px)';

        setTimeout(() => {
            track.style.transition = `transform ${1.0 + index * 0.25}s cubic-bezier(0.15, 0.85, 0.25, 1.05)`;
            track.style.transform = `translateY(-1620px)`;
        }, 50);
    });

    setTimeout(() => {
        evaluateGameLogic(finalMatrix);
        gameState.isSpinning = false;
        updateUI();
    }, 2200);
});

function evaluateGameLogic(matrix) {
    let spinWin = 0;
    let wildCount = 0;
    let crownCount = 0;

    matrix.forEach(col => {
        const middleSymbol = col[1];
        if (middleSymbol === '🔥WILD🔥') wildCount++;
        if (middleSymbol === '👑') crownCount++;
    });

    if (wildCount >= 2 || crownCount >= 2 || (matrix[0][1] === matrix[1][1] && matrix[1][1] === matrix[2][1])) {
        spinWin = gameState.bet * gameState.multiplier * (wildCount > 0 ? wildCount * 2 : 3);
        gameState.win = spinWin;
        gameState.balance += spinWin;
        audio.playWinSound();
    }

    if (crownCount >= 2 || wildCount >= 2) {
        gameState.freeSpins += 5;
        audio.playBonusSound();
        setTimeout(() => {
            alert('⚡ БОНУС! Выиграно +5 ФРИСПИНОВ! ⚡');
        }, 300);
    }
}

updateUI();
