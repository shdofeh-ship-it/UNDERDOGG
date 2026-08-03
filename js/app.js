// ============================================================
// ЕДИНАЯ СИСТЕМА: АВТОЗАПОЛНЕНИЕ, 1 РЕГИСТРАЦИЯ И ЖЕСТКИЕ БИЛЕТЫ
// ============================================================

document.addEventListener("DOMContentLoaded", function() {

    // --- 1. АНИМАЦИЯ ЗАГРУЗКИ ---
    const fill = document.getElementById("loadingFill");
    const percent = document.getElementById("loadingPercent");
    const btn = document.querySelector(".enter-btn");

    if (fill && percent) {
        let progress = 0;
        const interval = setInterval(function() {
            progress += Math.floor(Math.random() * 5) + 1;
            if (progress > 100) progress = 100;

            fill.style.width = progress + "%";
            percent.textContent = progress;

            if (progress === 100) {
                clearInterval(interval);
                setTimeout(function() {
                    if (btn) btn.classList.add("ready");
                }, 300);
            }
        }, 80);
    }

    // --- 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    
    // Получить данные зарегистрированного юзера
    function getUserData() {
        const raw = localStorage.getItem('underdogg_user_data');
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
        } catch(e) {
            return null;
        }
    }

    // Получить ключ билетов
    function getTicketsKey(user) {
        if (!user) return null;
        const id = user.epic || user.casino || user.tg;
        return id ? 'tickets_epic_' + id.trim() : null;
    }

    // Получить стабильные билеты (без рандома!)
    function getUserTickets() {
        const user = getUserData();
        if (!user) return { bronze: 0, silver: 0, gold: 0 };
        
        const key = getTicketsKey(user);
        if (!key) return { bronze: 0, silver: 0, gold: 0 };

        const raw = localStorage.getItem(key);
        if (!raw) return { bronze: 0, silver: 0, gold: 0 };
        
        try { return JSON.parse(raw); } 
        catch(e) { return { bronze: 0, silver: 0, gold: 0 }; }
    }

    // --- 3. АВТОПОДСТАНОВКА ДАННЫХ В ФОРМУ РОЗЫГРЫША ---
    function autofillContestForm() {
        const user = getUserData();
        const tgInput = document.getElementById('tgInput') || document.getElementById('contestTg');
        const kickInput = document.getElementById('kickInput') || document.getElementById('contestKick');
        const casinoInput = document.getElementById('casinoInput') || document.getElementById('contestCasino') || document.getElementById('epicInput');
        const submitBtn = document.getElementById('submitContestBtn') || document.getElementById('registerBtn');

        if (user) {
            if (tgInput) { tgInput.value = user.tg || ''; tgInput.readOnly = true; }
            if (kickInput) { kickInput.value = user.kick || ''; kickInput.readOnly = true; }
            if (casinoInput) { casinoInput.value = user.epic || user.casino || ''; casinoInput.readOnly = true; }

            // Если человек уже участвует в конкурсе
            if (localStorage.getItem('underdogg_joined_contest') === 'true') {
                if (submitBtn) {
                    submitBtn.textContent = '✅ ВЫ УЖЕ УЧАСТВУЕТЕ';
                    submitBtn.disabled = true;
                    submitBtn.style.opacity = '0.6';
                    submitBtn.style.cursor = 'not-allowed';
                }
            }
        }
    }

    // --- 4. ОБРАБОТКА НАЖАТИЯ "УЧАСТВОВАТЬ" (ТОЛЬКО 1 РАЗ) ---
    const submitBtn = document.getElementById('submitContestBtn') || document.getElementById('registerBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();

            if (localStorage.getItem('underdogg_joined_contest') === 'true') {
                alert('⚠️ Вы уже зарегистрированы в розыгрыше!');
                return;
            }

            const tgInput = document.getElementById('tgInput') || document.getElementById('contestTg');
            const kickInput = document.getElementById('kickInput') || document.getElementById('contestKick');
            const casinoInput = document.getElementById('casinoInput') || document.getElementById('contestCasino') || document.getElementById('epicInput');

            const tg = tgInput ? tgInput.value.trim() : '';
            const kick = kickInput ? kickInput.value.trim() : '';
            const casino = casinoInput ? casinoInput.value.trim() : '';

            if (!tg || !kick || !casino) {
                alert('⚠️ Заполните все поля!');
                return;
            }

            // Сохраняем профиль (если не был сохранен)
            const newUser = { tg, kick, casino, epic: casino, date: new Date().toISOString() };
            localStorage.setItem('underdogg_user_data', JSON.stringify(newUser));

            // Записываем в список участников для админа
            const adminData = JSON.parse(localStorage.getItem('underdogg_admin') || '{}');
            adminData.participants = adminData.participants || [];
            adminData.participants.push(newUser);
            localStorage.setItem('underdogg_admin', JSON.stringify(adminData));

            // Блокируем повторную регистрацию
            localStorage.setItem('underdogg_joined_contest', 'true');

            submitBtn.textContent = '✅ ВЫ УЧАСТВУЕТЕ!';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.6';
            submitBtn.style.cursor = 'not-allowed';

            alert('🎉 Успешно! Вы зарегистрированы в розыгрыше.');
        });
    }

    // --- 5. МОДАЛКА "МОИ БИЛЕТЫ" (ЖЕСТКИЕ ДАННЫЕ ВМЕСТО РАНДОМА) ---
    const myTicketsBtn = document.getElementById('myTicketsBtn');
    if (myTicketsBtn) {
        // Перехватываем и глушим старые обработчики, чтобы убрать рандом
        myTicketsBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();

            const user = getUserData();
            if (!user) {
                alert("⚠️ Сначала зарегистрируйтесь на главной странице!");
                return;
            }

            const tickets = getUserTickets();

            // Вставляем ТОЧНЫЕ значения из памяти
            const b = document.getElementById('myBronzeCount');
            const s = document.getElementById('mySilverCount');
            const g = document.getElementById('myGoldCount');
            const t = document.getElementById('myTotalTicketsCount');

            if (b) b.textContent = tickets.bronze || 0;
            if (s) s.textContent = tickets.silver || 0;
            if (g) g.textContent = tickets.gold || 0;
            if (t) t.textContent = (tickets.bronze || 0) + (tickets.silver || 0) + (tickets.gold || 0);

            const modal = document.getElementById('myTicketsModal');
            if (modal) modal.style.display = 'flex';
        };
    }

    // Запускаем автозаполнение полей при загрузке
    autofillContestForm();
});
// ============================================================
// ГЛОБАЛЬНАЯ ДИНАМИЧЕСКАЯ СИНХРОНИЗАЦИЯ СТАТУСА СТРИМА С АДМИНКОЙ
// ============================================================
function syncGlobalStreamStatus() {
    // 1. Проверяем статус в localStorage
    const streamStatus = (localStorage.getItem('underdogg_stream_status') || '').toUpperCase();
    const streamIsLive = localStorage.getItem('streamIsLive');
    const isLive = localStorage.getItem('isLive');

    // Проверяем объект админки под ключом underdogg_admin
    let adminLive = false;
    try {
        const adminData = JSON.parse(localStorage.getItem('underdogg_admin') || '{}');
        if (adminData.isLive === true || adminData.isLive === 'true' || adminData.streamStatus === 'ONLINE') {
            adminLive = true;
        }
    } catch(e) {}

    // Определяем, онлайн ли стрим
    const isOnline = streamStatus === 'ONLINE' || 
                     streamStatus === 'TRUE' || 
                     streamIsLive === 'true' || 
                     streamIsLive === true || 
                     isLive === 'true' || 
                     isLive === true || 
                     adminLive;

    // 2. Элементы на главной странице входa (index.html)
    const indexDot = document.getElementById('indexStatusDot');
    const indexLabel = document.getElementById('indexStatusLabel');

    if (indexLabel) {
        indexLabel.textContent = isOnline ? 'В СЕТИ' : 'ОФФЛАЙН';
        indexLabel.style.color = isOnline ? '#ff3333' : '#888888';
        indexLabel.style.textShadow = isOnline ? '0 0 8px rgba(255, 0, 0, 0.6)' : 'none';
    }
    if (indexDot) {
        indexDot.style.background = isOnline ? '#ff0000' : '#555555';
        indexDot.style.boxShadow = isOnline ? '0 0 10px #ff0000' : 'none';
        indexDot.style.animation = isOnline ? 'pulse 1.5s infinite' : 'none';
    }

    // 3. Элементы внутри панели управления (home.html)
    const onlineText = document.querySelector('.online-text');
    const pulseDot = document.querySelector('.pulse-dot');
    const signalBars = document.querySelectorAll('.signal-icon .bar');
    const badges = document.querySelectorAll('.badge-live, .badge-online');

    if (onlineText) {
        onlineText.textContent = isOnline ? 'В СЕТИ' : 'ОФФЛАЙН';
        onlineText.style.color = isOnline ? '#ff4040' : '#888888';
    }

    if (pulseDot) {
        pulseDot.style.background = isOnline ? '#ff0000' : '#555555';
        pulseDot.style.boxShadow = isOnline ? '0 0 15px #ff0000' : 'none';
        pulseDot.style.animation = isOnline ? 'pulse 1.5s infinite' : 'none';
    }

    signalBars.forEach(bar => {
        bar.style.background = isOnline ? '#ff4040' : '#555555';
    });

    badges.forEach(badge => {
        badge.textContent = isOnline ? 'ОНЛАЙН' : 'ОФФЛАЙН';
        badge.style.background = isOnline ? '#ff1a3c' : '#333333';
        badge.style.borderColor = isOnline ? '#ff1a3c' : '#555555';
        badge.style.boxShadow = isOnline ? '0 0 15px rgba(255, 26, 60, 0.4)' : 'none';
    });
}

// Запускаем постоянное отслеживание изменений каждые 1 секунду и по событиям storage
document.addEventListener('DOMContentLoaded', function() {
    syncGlobalStreamStatus();
    setInterval(syncGlobalStreamStatus, 1000);
    window.addEventListener('storage', syncGlobalStreamStatus);
});
