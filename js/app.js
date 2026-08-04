// ============================================================
// 0. ИНИЦИАЛИЗАЦИЯ FIREBASE (СЕРВЕР)
// ============================================================
const firebaseConfig = {
    databaseURL: "https://underdogg-app-f5379-default-rtdb.europe-west1.firebasedatabase.app/"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();


document.addEventListener("DOMContentLoaded", function() {

    // ============================================================
    // 1. ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP
    // ============================================================
    let currentTgUsername = null;
    try {
        const tgApp = window.Telegram?.WebApp;
        if (tgApp) {
            tgApp.ready();
            tgApp.expand();
            if (tgApp.initDataUnsafe?.user?.username) {
                currentTgUsername = `@${tgApp.initDataUnsafe.user.username}`;
            }
        }
    } catch (e) {
        console.warn("Telegram WebApp API:", e);
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
            regTgInput.value = currentTgUsername;
            regTgInput.readOnly = true;
            regTgInput.style.opacity = '0.7';
            regTgInput.style.cursor = 'not-allowed';
        } else {
            regTgInput.value = '';
            regTgInput.placeholder = '❌ Установите @username в Telegram!';
            regTgInput.readOnly = true;
            if (warningBlock) {
                warningBlock.innerHTML = '⚠️ <b>Ошибка:</b> У вас не установлен Username в Telegram. Установите @username в настройках и перезапустите бота!';
                warningBlock.style.color = '#ff3333';
            }
            if (registerBtn) {
                registerBtn.disabled = true;
                registerBtn.style.opacity = '0.4';
            }
        }
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (registerBtn.disabled) return;

            const tgVal = regTgInput ? regTgInput.value.trim() : currentTgUsername;
            const kickVal = regKickInput ? regKickInput.value.trim() : '';
            const epicVal = regEpicInput ? regEpicInput.value.trim() : '';

            if (!tgVal) {
                alert('⚠️ Ошибка: Telegram ID не найден!');
                return;
            }
            if (!kickVal || !epicVal) {
                alert('⚠️ Введите ваш ник на Kick и ник в Epicstar!');
                return;
            }

            const userData = { tg: tgVal, kick: kickVal, epic: epicVal };
            localStorage.setItem('underdogg_user_data', JSON.stringify(userData));
            localStorage.setItem('underdogg_registered', 'true');

            // Сохраняем пользователя в базу сервера
            db.ref('users/' + tgVal.replace('@', '')).set(userData);

            alert('🎉 Регистрация успешно завершена!');
            closeAllModals();
        });
    }

    // ============================================================
    // 3. ЗАКРЫТИЕ МОДАЛОК
    // ============================================================
    function closeAllModals() {
        const modals = document.querySelectorAll('.modal, .modal-overlay, #registerModal, #myTicketsModal');
        modals.forEach(m => m.style.display = 'none');
    }

    document.querySelectorAll('.close-modal, .modal-close, #closeRegisterBtn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            closeAllModals();
        });
    });

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

        if (localStorage.getItem('underdogg_joined_contest') === 'true' && joinBtn) {
            joinBtn.textContent = '✅ ВЫ УЖЕ УЧАСТВУЕТЕ';
            joinBtn.disabled = true;
            joinBtn.style.opacity = '0.5';
        } else if (joinBtn) {
            joinBtn.addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.setItem('underdogg_joined_contest', 'true');
                joinBtn.textContent = '✅ ВЫ УЖЕ УЧАСТВУЕТЕ';
                joinBtn.disabled = true;
                joinBtn.style.opacity = '0.5';
                
                // Фиксируем участие на сервере
                if (user && user.tg) {
                    db.ref('contest_participants/' + user.tg.replace('@', '')).set(user);
                }

                alert('🎉 Вы приняли участие в розыгрыше!');
            });
        }
    }

    setupContestForm();
});

// ============================================================
// 5. ЖИВОЕ ОБНОВЛЕНИЕ СТАТУСА СТРИМА С СЕРВЕРА
// ============================================================
db.ref('streamIsLive').on('value', (snapshot) => {
    const isOnline = snapshot.val() === true;

    const indexDot = document.getElementById('indexStatusDot');
    const indexLabel = document.getElementById('indexStatusLabel');
    const onlineText = document.querySelector('.online-text');
    const pulseDot = document.querySelector('.pulse-dot');
    const signalBars = document.querySelectorAll('.signal-icon .bar');
    const badges = document.querySelectorAll('.badge-live, .badge-online');

    if (indexLabel) {
        indexLabel.textContent = isOnline ? 'В СЕТИ' : 'ОФФЛАЙН';
        indexLabel.style.color = isOnline ? '#ff3333' : '#888888';
    }
    if (indexDot) {
        indexDot.style.background = isOnline ? '#ff0000' : '#555555';
        indexDot.style.boxShadow = isOnline ? '0 0 10px #ff0000' : 'none';
    }
    if (onlineText) {
        onlineText.textContent = isOnline ? 'В СЕТИ' : 'ОФФЛАЙН';
        onlineText.style.color = isOnline ? '#ff4040' : '#888888';
    }
    if (pulseDot) {
        pulseDot.style.background = isOnline ? '#ff0000' : '#555555';
        pulseDot.style.boxShadow = isOnline ? '0 0 15px #ff0000' : 'none';
    }
    signalBars.forEach(bar => {
        bar.style.background = isOnline ? '#ff4040' : '#555555';
    });
    badges.forEach(badge => {
        badge.textContent = isOnline ? 'ОНЛАЙН' : 'ОФФЛАЙН';
        badge.style.background = isOnline ? '#ff1a3c' : '#333333';
    });
});
