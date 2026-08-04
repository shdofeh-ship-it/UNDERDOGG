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
        window.db = db;
    } else {
        console.error("Firebase SDK не загрузился в HTML!");
    }
} catch (e) {
    console.error("Ошибка Firebase:", e);
}

// ============================================================
// 1. ПОЛУЧЕНИЕ TELEGRAM USERNAME
// ============================================================
function getTelegramUser() {
    try {
        const tgApp = window.Telegram?.WebApp;
        if (tgApp) {
            tgApp.ready();
            tgApp.expand();
            const user = tgApp.initDataUnsafe?.user;
            if (user && user.username) {
                return {
                    username: user.username,
                    id: user.id,
                    firstName: user.first_name || '',
                    lastName: user.last_name || '',
                    fullName: (user.first_name || '') + (user.last_name ? ' ' + user.last_name : '')
                };
            }
        }
    } catch (e) {
        console.warn("Ошибка при получении данных Telegram:", e);
    }
    return null;
}

// ============================================================
// 2. АНТИФРОД СИСТЕМЫ
// ============================================================

// 2.1 Проверка на бота (реальная через API)
async function checkIsBot(telegramId) {
    try {
        const botToken = localStorage.getItem('bot_token') || '';
        if (!botToken) {
            console.warn('Токен бота не найден для проверки');
            return { isBot: false, user: null };
        }
        
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${telegramId}`);
        const data = await response.json();
        
        if (data.ok && data.result) {
            const user = data.result;
            const isBot = 
                (user.bio === '' || user.bio === null) ||
                (user.username === '' || user.username === null) ||
                (user.first_name && user.first_name.length < 2) ||
                user.is_bot === true;
            
            return { isBot, user };
        }
    } catch (e) {
        console.error('Ошибка проверки на бота:', e);
    }
    return { isBot: false, user: null };
}

// 2.2 Проверка возраста аккаунта
function getAccountAge(telegramUser) {
    if (!telegramUser) return 0;
    
    if (telegramUser.created_at) {
        const created = new Date(telegramUser.created_at);
        const now = new Date();
        return (now - created) / (1000 * 60 * 60 * 24);
    }
    
    const userData = JSON.parse(localStorage.getItem('underdogg_user') || '{}');
    if (userData.joinDate) {
        const created = new Date(userData.joinDate);
        const now = new Date();
        return (now - created) / (1000 * 60 * 60 * 24);
    }
    
    return 0;
}

// 2.3 Проверка подписки на канал
async function checkSubscription(telegramId, channelUsername = '@und3r_d0gg') {
    try {
        const botToken = localStorage.getItem('bot_token') || '';
        if (!botToken) return false;
        
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelUsername}&user_id=${telegramId}`);
        const data = await response.json();
        
        if (data.ok && data.result) {
            const status = data.result.status;
            return ['creator', 'administrator', 'member'].includes(status);
        }
    } catch (e) {
        console.error('Ошибка проверки подписки:', e);
    }
    return false;
}

// 2.4 Проверка на мультиаккаунтинг
function checkMultiAccount(telegramId) {
    const participants = JSON.parse(localStorage.getItem('underdogg_participants') || '[]');
    const userIP = localStorage.getItem('user_ip') || '';
    const userData = JSON.parse(localStorage.getItem('underdogg_user') || '{}');
    
    const sameIP = participants.filter(p => p.ip === userIP && p.telegramId !== telegramId);
    const sameKick = participants.filter(p => p.kick === userData.kick && p.telegramId !== telegramId);
    const sameEpic = participants.filter(p => p.epic === userData.epic && p.telegramId !== telegramId);
    
    return {
        sameIP: sameIP.length > 0,
        sameKick: sameKick.length > 0,
        sameEpic: sameEpic.length > 0,
        count: sameIP.length + sameKick.length + sameEpic.length
    };
}

// 2.5 Генерация капчи
function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars[Math.floor(Math.random() * chars.length)];
    }
    return captcha;
}

// 2.6 Сохранение IP пользователя
function saveUserIP() {
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            if (data.ip) {
                localStorage.setItem('user_ip', data.ip);
            }
        })
        .catch(() => {});
}

// 2.7 Проверка на недавно созданный аккаунт (< 30 дней)
function isAccountTooYoung(telegramUser) {
    const age = getAccountAge(telegramUser);
    return age < 30 && age > 0;
}

// 2.8 Проверка на фейковый аккаунт (нет фото, нет био, нет username)
function isFakeAccount(telegramUser) {
    if (!telegramUser) return true;
    return !telegramUser.username || 
           (telegramUser.first_name && telegramUser.first_name.length < 2) ||
           (telegramUser.bio === '' || telegramUser.bio === undefined);
}

// 2.9 Комплексная проверка безопасности
async function runSecurityCheck(telegramUser) {
    const results = {
        passed: true,
        errors: [],
        warnings: []
    };
    
    if (!telegramUser || !telegramUser.id) {
        results.passed = false;
        results.errors.push('❌ Пользователь не авторизован в Telegram');
        return results;
    }
    
    // Проверка на фейк
    if (isFakeAccount(telegramUser)) {
        results.passed = false;
        results.errors.push('❌ Аккаунт выглядит фейковым (нет username или короткое имя)');
    }
    
    // Проверка возраста
    if (isAccountTooYoung(telegramUser)) {
        results.passed = false;
        results.errors.push('❌ Аккаунт слишком новый (меньше 30 дней)');
    }
    
    // Проверка на бота
    const botCheck = await checkIsBot(telegramUser.id);
    if (botCheck.isBot) {
        results.passed = false;
        results.errors.push('❌ Аккаунт определён как бот');
    }
    
    // Проверка на мультиаккаунтинг
    const multiAccount = checkMultiAccount(telegramUser.id);
    if (multiAccount.sameIP) {
        results.warnings.push('⚠️ Обнаружен другой аккаунт с вашего IP');
    }
    if (multiAccount.sameKick) {
        results.warnings.push('⚠️ Обнаружен другой аккаунт с таким же Kick');
    }
    if (multiAccount.sameEpic) {
        results.warnings.push('⚠️ Обнаружен другой аккаунт с таким же Epicstar');
    }
    if (multiAccount.count > 3) {
        results.passed = false;
        results.errors.push('❌ Слишком много похожих аккаунтов (мультиаккаунтинг)');
    }
    
    return results;
}

// ============================================================
// 3. ФОРМА РЕГИСТРАЦИИ
// ============================================================
document.addEventListener("DOMContentLoaded", function() {

    // Сохраняем IP
    saveUserIP();

    function applyTelegramData() {
        const tgData = getTelegramUser();
        const regTgInput = document.getElementById('regTg');
        const registerBtn = document.getElementById('registerBtn');
        const warningBlock = document.getElementById('warningBlock');

        if (regTgInput) {
            if (tgData && tgData.username) {
                regTgInput.value = '@' + tgData.username;
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

    applyTelegramData();
    setTimeout(applyTelegramData, 500);

    // ============================================================
    // 4. РЕГИСТРАЦИЯ С ЗАЩИТОЙ
    // ============================================================
    const registerBtn = document.getElementById('registerBtn');
    const regTgInput = document.getElementById('regTg');
    const regKickInput = document.getElementById('regKick');
    const regEpicInput = document.getElementById('regEpic');

    if (registerBtn && regTgInput && regKickInput && regEpicInput) {
        registerBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            const tgData = getTelegramUser();
            const kickVal = regKickInput ? regKickInput.value.trim() : '';
            const epicVal = regEpicInput ? regEpicInput.value.trim() : '';

            if (!tgData || !tgData.username) {
                alert('⚠️ У вас отсутствует Telegram @username! Без него регистрация невозможна.');
                return;
            }
            if (!kickVal || !epicVal) {
                alert('⚠️ Заполните ваши ники Kick и Epicstar!');
                return;
            }

            // ===== АНТИФРОД ПРОВЕРКИ =====
            const security = await runSecurityCheck(tgData);
            
            if (!security.passed) {
                alert('❌ Регистрация отклонена:\n\n' + security.errors.join('\n'));
                if (security.warnings.length > 0) {
                    alert('⚠️ Предупреждения:\n\n' + security.warnings.join('\n'));
                }
                return;
            }

            if (security.warnings.length > 0) {
                if (!confirm('⚠️ Обнаружены предупреждения:\n\n' + security.warnings.join('\n') + '\n\nПродолжить регистрацию?')) {
                    return;
                }
            }

            // ===== СОХРАНЕНИЕ =====
            const userData = { 
                tg: '@' + tgData.username,
                kick: kickVal, 
                epic: epicVal,
                telegramId: tgData.id,
                username: tgData.username,
                firstName: tgData.firstName || '',
                lastName: tgData.lastName || '',
                registered: true,
                joinDate: new Date().toISOString(),
                ip: localStorage.getItem('user_ip') || ''
            };

            localStorage.setItem('underdogg_user_data', JSON.stringify(userData));
            localStorage.setItem('underdogg_user', JSON.stringify(userData));
            localStorage.setItem('underdogg_registered', 'true');

            if (db) {
                db.ref('users/' + tgData.username).set(userData);
            }

            alert('🎉 Регистрация успешно завершена!');
            closeAllModals();
            
            document.querySelectorAll(".disabled").forEach(btn => btn.classList.remove("disabled"));
        });
    }

    // ============================================================
    // 5. ЗАКРЫТИЕ МОДАЛОК
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
    // 6. ФОРМА РОЗЫГРЫША
    // ============================================================
    function setupContestForm() {
        const savedData = localStorage.getItem('underdogg_user_data');
        let user = null;
        if (savedData) {
            try { user = JSON.parse(savedData); } catch(e) {}
        }

        const tgData = getTelegramUser();
        const contestTg = document.getElementById('tgInput') || document.getElementById('contestTg');
        const contestKick = document.getElementById('kickInput') || document.getElementById('contestKick');
        const contestEpic = document.getElementById('casinoInput') || document.getElementById('contestCasino') || document.getElementById('contestEpic');
        const joinBtn = document.getElementById('submitContestBtn') || document.getElementById('joinContestBtn');

        if (contestTg) {
            contestTg.value = (user && user.tg) ? user.tg : (tgData ? '@' + tgData.username : '');
            contestTg.readOnly = true;
            contestTg.style.opacity = '0.7';
            contestTg.style.cursor = 'not-allowed';
        }
        if (contestKick) {
            contestKick.value = (user && user.kick) ? user.kick : '';
            contestKick.readOnly = true;
            contestKick.style.opacity = '0.7';
            contestKick.style.cursor = 'not-allowed';
        }
        if (contestEpic) {
            contestEpic.value = (user && user.epic) ? user.epic : '';
            contestEpic.readOnly = true;
            contestEpic.style.opacity = '0.7';
            contestEpic.style.cursor = 'not-allowed';
        }

        if (localStorage.getItem('underdogg_joined_contest') === 'true' && joinBtn) {
            joinBtn.textContent = '✅ ВЫ УЖЕ УЧАСТВУЕТЕ';
            joinBtn.disabled = true;
            joinBtn.style.opacity = '0.5';
        } else if (joinBtn) {
            joinBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                
                // Дополнительная проверка перед участием
                const tgData = getTelegramUser();
                if (tgData) {
                    const security = await runSecurityCheck(tgData);
                    if (!security.passed) {
                        alert('❌ Участие отклонено:\n\n' + security.errors.join('\n'));
                        return;
                    }
                }
                
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

    // ============================================================
    // 7. СТАТУС СТРИМА
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

    if (db) {
        db.ref('streamIsLive').on('value', (snapshot) => {
            const isOnline = snapshot.val() === true;
            updateStreamUI(isOnline);
        });
    }
});
