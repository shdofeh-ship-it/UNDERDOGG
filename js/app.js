document.addEventListener("DOMContentLoaded", function() {

    // ============================================================
    // 1. БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP API
    // ============================================================
    let currentTgUsername = null;

    try {
        const tgApp = window.Telegram?.WebApp;
        if (tgApp) {
            tgApp.ready();
            tgApp.expand(); // Разворачиваем приложение во весь экран
            
            // Достаем Telegram username пользователя
            const tgUser = tgApp.initDataUnsafe?.user;
            if (tgUser?.username) {
                currentTgUsername = `@${tgUser.username}`;
            }
        }
    } catch (e) {
        console.warn("Telegram WebApp API недоступен:", e);
    }


    // ============================================================
    // 2. ФОРМА РЕГИСТРАЦИИ (index.html)
    // ============================================================
    const regTgInput = document.getElementById('regTg');
    const regKickInput = document.getElementById('regKick');
    const regEpicInput = document.getElementById('regEpic');
    const registerBtn = document.getElementById('registerBtn');
    const warningBlock = document.getElementById('warningBlock');

    if (regTgInput) {
        if (currentTgUsername) {
            // Если у пользователя есть username в Telegram — ставим и БЛОКИРУЕМ
            regTgInput.value = currentTgUsername;
            regTgInput.readOnly = true;
            regTgInput.style.opacity = '0.7';
            regTgInput.style.cursor = 'not-allowed';
        } else {
            // Если username НЕ установлен в Telegram — предупреждаем
            regTgInput.value = '';
            regTgInput.placeholder = '❌ Установите @username в Telegram!';
            regTgInput.readOnly = true;
            
            if (warningBlock) {
                warningBlock.innerHTML = '⚠️ <b>Ошибка:</b> У вас не установлен Username в Telegram. Перейдите в настройки Telegram, установите @username и перезайдите в бота!';
                warningBlock.style.color = '#ff3333';
            }
            if (registerBtn) {
                registerBtn.disabled = true;
                registerBtn.style.opacity = '0.4';
                registerBtn.style.cursor = 'not-allowed';
            }
        }
    }

    // Сохранение данных при регистрации
    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (registerBtn.disabled) return;

            const tgVal = regTgInput ? regTgInput.value.trim() : currentTgUsername;
            const kickVal = regKickInput ? regKickInput.value.trim() : '';
            const epicVal = regEpicInput ? regEpicInput.value.trim() : '';

            if (!tgVal) {
                alert('⚠️ Ошибка: Telegram ID не найден! Установите @username в настройках Telegram.');
                return;
            }
            if (!kickVal || !epicVal) {
                alert('⚠️ Пожалуйста, введите ваш ник на Kick и ник в Epicstar!');
                return;
            }

            const userData = {
                tg: tgVal,
                kick: kickVal,
                epic: epicVal
            };

            localStorage.setItem('underdogg_user_data', JSON.stringify(userData));
            localStorage.setItem('underdogg_registered', 'true');

            alert('🎉 Регистрация успешно завершена!');
            closeAllModals();
        });
    }


    // ============================================================
    // 3. ЗАКРЫТИЕ МОДАЛЬНЫХ ОКЕН
    // ============================================================
    function closeAllModals() {
        const modals = document.querySelectorAll('.modal, .modal-overlay, #registerModal, #myTicketsModal');
        modals.forEach(modal => {
            modal.classList.remove('active');
            if (modal.style.display !== 'none' && !modal.classList.contains('main-wrapper')) {
                modal.style.display = 'none';
            }
        });
    }

    // Клик по кнопкам закрытия / крестикам
    const closeBtns = document.querySelectorAll('.close-modal, .modal-close, #closeRegisterBtn');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            closeAllModals();
        });
    });

    // Клик мимо окна (по темному фону)
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal') || e.target.classList.contains('modal-overlay')) {
            closeAllModals();
        }
    });


    // ============================================================
    // 4. ФОРМА РОЗЫГРЫША (home.html)
    // ============================================================
    function setupContestForm() {
        const savedData = localStorage.getItem('underdogg_user_data');
        let user = null;
        if (savedData) {
            try { user = JSON.parse(savedData); } catch(e) {}
        }

        const contestTg = document.getElementById('tgInput') || document.getElementById('contestTg');
        const contestKick = document.getElementById('kickInput') || document.getElementById('contestKick');
        const contestEpic = document.getElementById('casinoInput') || document.getElementById('contestCasino') || document.getElementById('contestEpic');
        const joinBtn = document.getElementById('submitContestBtn') || document.getElementById('joinContestBtn');

        // Подставляем сохраненные данные и делаем поля ТОЛЬКО ЧТЕНИЕ
        if (contestTg) {
            contestTg.value = (user && user.tg) ? user.tg : (currentTgUsername || '');
            contestTg.readOnly = true;
            contestTg.style.opacity = '0.8';
        }
        if (contestKick) {
            contestKick.value = (user && user.kick) ? user.kick : '';
            contestKick.readOnly = true;
            contestKick.style.opacity = '0.8';
        }
        if (contestEpic) {
            contestEpic.value = (user && user.epic) ? user.epic : '';
            contestEpic.readOnly = true;
            contestEpic.style.opacity = '0.8';
        }

        // Логика кнопки участия
        if (localStorage.getItem('underdogg_joined_contest') === 'true' && joinBtn) {
            joinBtn.textContent = '✅ ВЫ УЖЕ УЧАСТВУЕТЕ';
            joinBtn.disabled = true;
            joinBtn.style.opacity = '0.5';
            joinBtn.style.cursor = 'not-allowed';
        } else if (joinBtn) {
            joinBtn.addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.setItem('underdogg_joined_contest', 'true');
                joinBtn.textContent = '✅ ВЫ УЖЕ УЧАСТВУЕТЕ';
                joinBtn.disabled = true;
                joinBtn.style.opacity = '0.5';
                joinBtn.style.cursor = 'not-allowed';
                alert('🎉 Вы успешно приняли участие в розыгрыше!');
            });
        }
    }

    setupContestForm();
});


// ============================================================
// 5. ГЛОБАЛЬНАЯ СИНХРОНИЗАЦИЯ СТАТУСА СТРИМА С АДМИНКОЙ
// ============================================================
function syncGlobalStreamStatus() {
    const streamStatus = (localStorage.getItem('underdogg_stream_status') || '').toUpperCase();
    const streamIsLive = localStorage.getItem('streamIsLive');
    const isLive = localStorage.getItem('isLive');

    let adminLive = false;
    try {
        const adminData = JSON.parse(localStorage.getItem('underdogg_admin') || '{}');
        if (adminData.isLive === true || adminData.isLive === 'true' || adminData.streamStatus === 'ONLINE') {
            adminLive = true;
        }
    } catch(e) {}

    const isOnline = streamStatus === 'ONLINE' || 
                     streamStatus === 'TRUE' || 
                     streamIsLive === 'true' || 
                     streamIsLive === true || 
                     isLive === 'true' || 
                     isLive === true || 
                     adminLive;

    // Индикаторы на index.html
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

    // Индикаторы на home.html
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

// Постоянный опрос состояния стрима
syncGlobalStreamStatus();
setInterval(syncGlobalStreamStatus, 1000);
window.addEventListener('storage', syncGlobalStreamStatus);
