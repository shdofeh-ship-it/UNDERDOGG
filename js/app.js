// ============================================================
// 0. ИНИЦИАЛИЗАЦИЯ FIREBASE (СЕРВЕР)
// ============================================================
const firebaseConfig = {
    databaseURL: "https://underdogg-app-f5379-default-rtdb.firebaseio.com/"
};


window.db = null;
let db = null;

try {
    if (window.firebase) {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.database();
        window.db = db; // Делаем доступным глобально
    } else {
        console.error("Firebase SDK не загрузился в HTML!");
    }
} catch (e) {
    console.error("Ошибка Firebase:", e);
}


// ============================================================
// 1. ПОЛУЧЕНИЕ И ДЕНОНСАЦИЯ TELEGRAM USERNAME
// ============================================================
function getTelegramUser() {
    try {
        const tgApp = window.Telegram?.WebApp;
        if (tgApp) {
            tgApp.ready();
            tgApp.expand();
            const user = tgApp.initDataUnsafe?.user;
            if (user && user.username) {
                return `@${user.username}`;
            }
        }
    } catch (e) {
        console.warn("Ошибка при получении данных Telegram:", e);
    }
    return null;
}

document.addEventListener("DOMContentLoaded", function() {

    // Пробуем получить Username с небольшой задержкой (Telegram иногда тупит)
    function applyTelegramData() {
        const currentTgUsername = getTelegramUser();
        const regTgInput = document.getElementById('regTg');
        const registerBtn = document.getElementById('registerBtn');
        const warningBlock = document.getElementById('warningBlock');

        if (regTgInput) {
            if (currentTgUsername) {
                regTgInput.value = currentTgUsername;
                regTgInput.readOnly = true;
                regTgInput.style.opacity = '0.7';
                regTgInput.style.cursor = 'not-allowed';

                if (warningBlock) {
                    warningBlock.style.display = 'none';
                }
                if (registerBtn) {
                    registerBtn.disabled = false;
                    registerBtn.style.opacity = '1';
                    registerBtn.style.cursor = 'pointer';
                }
            } else {
                regTgInput.value = '';
                regTgInput.placeholder = '❌ Установите @username в Telegram!';
                regTgInput.readOnly = true;

                if (warningBlock) {
                    warningBlock.innerHTML = '⚠️ <b>Внимание:</b> Username в Telegram не найден. Установите @username в настройках Telegram и перезапустите бота!';
                    warningBlock.style.color = '#ffcc00';
                }
            }
        }
    }

    // Запускаем сразу и повторно через 500мс для надежности
    applyTelegramData();
    setTimeout(applyTelegramData, 500);

    // ============================================================
    // 2. ФОРМА РЕГИСТРАЦИИ (index.html)
    // ============================================================
    const registerBtn = document.getElementById('registerBtn');
    const regTgInput = document.getElementById('regTg');
    const regKickInput = document.getElementById('regKick');
    const regEpicInput = document.getElementById('regEpic');

        if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const tgVal = regTgInput ? regTgInput.value.trim() : getTelegramUser();
            const kickVal = regKickInput ? regKickInput.value.trim() : '';
            const epicVal = regEpicInput ? regEpicInput.value.trim() : '';

            if (!tgVal) {
                alert('⚠️ У вас отсутствует Telegram @username! Без него регистрация невозможна.');
                return;
            }
            if (!kickVal || !epicVal) {
                alert('⚠️ Заполните ваши ники Kick и Epicstar!');
                return;
            }

            const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

            const userData = { 
                tg: tgVal, 
                kick: kickVal, 
                epic: epicVal,
                telegramId: tgUser ? tgUser.id : tgVal,
                username: tgVal.replace('@', ''),
                registered: true
            };

            // Сохраняем под всеми ключами, чтобы обе страницы видоизменяли данные
            localStorage.setItem('underdogg_user_data', JSON.stringify(userData));
            localStorage.setItem('underdogg_user', JSON.stringify(userData));
            localStorage.setItem('underdogg_registered', 'true');

            // Сохраняем в Базу Firebase
            if (db) {
                db.ref('users/' + tgVal.replace('@', '')).set(userData);
            }

            alert('🎉 Данные сохранены!');
            closeAllModals();
            
            // Если на странице есть заблокированные кнопки — разблокируем их сразу
            document.querySelectorAll(".disabled").forEach(btn => btn.classList.remove("disabled"));
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

    // ============================================================
    // 4. ФОРМА РОЗЫГРЫША (home.html)
    // ============================================================
    function setupContestForm() {
        const savedData = localStorage.getItem('underdogg_user_data');
        let user = null;
        if (savedData) {
            try { user = JSON.parse(savedData); } catch(e) {}
        }

        const currentTgUsername = getTelegramUser();
        const contestTg = document.getElementById('tgInput') || document.getElementById('contestTg');
        const contestKick = document.getElementById('kickInput') || document.getElementById('contestKick');
        const contestEpic = document.getElementById('casinoInput') || document.getElementById('contestCasino') || document.getElementById('contestEpic');
        const joinBtn = document.getElementById('submitContestBtn') || document.getElementById('joinContestBtn');

        if (contestTg) {
            contestTg.value = (user && user.tg) ? user.tg : (currentTgUsername || '');
            contestTg.readOnly = true;
        }
        if (contestKick) {
            contestKick.value = (user && user.kick) ? user.kick : '';
            contestKick.readOnly = true;
        }
        if (contestEpic) {
            contestEpic.value = (user && user.epic) ? user.epic : '';
            contestEpic.readOnly = true;
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

                if (db && user && user.tg) {
                    db.ref('contest_participants/' + user.tg.replace('@', '')).set(user);
                }

                alert('🎉 Вы успешно приняли участие!');
            });
        }
    }

    setupContestForm();
});

// ============================================================
// 5. ЖИВОЙ СТАТУС СТРИМА С СЕРВЕРА
// ============================================================
function updateStreamUI(isOnline) {
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
}

// Слушаем Firebase
if (db) {
    db.ref('streamIsLive').on('value', (snapshot) => {
        const isOnline = snapshot.val() === true;
        updateStreamUI(isOnline);
    });
}
