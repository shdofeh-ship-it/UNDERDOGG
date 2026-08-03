// Ждём полной загрузки страницы
document.addEventListener("DOMContentLoaded", function() {

    console.log("DOM загружен, ищем элементы...");

    // Находим элементы
    const fill = document.getElementById("loadingFill");
    const percent = document.getElementById("loadingPercent");
    const btn = document.querySelector(".enter-btn");

    // Проверяем, что элементы найдены
    if (!fill) {
        console.error("Элемент #loadingFill не найден!");
        return;
    }
    if (!percent) {
        console.error("Элемент #loadingPercent не найден!");
        return;
    }

    console.log("Элементы найдены, запускаем загрузку...");

    let progress = 0;

    // Запускаем интервал
    const interval = setInterval(function() {

        // Увеличиваем прогресс (от 1 до 5 за раз)
        progress += Math.floor(Math.random() * 5) + 1;

        // Не даём перескочить через 100
        if (progress > 100) progress = 100;

        // Обновляем полосу и текст
        fill.style.width = progress + "%";
        percent.textContent = progress;

        console.log("Прогресс:", progress); // Лог в консоль

        // Когда загрузка завершена
        if (progress === 100) {
            clearInterval(interval);
            console.log("Загрузка завершена!");

            // Показываем кнопку через 300ms
            setTimeout(function() {
                if (btn) {
                    btn.classList.add("ready");
                    console.log("Кнопка активирована");
                }
            }, 300);
        }

    }, 80); // Обновление каждые 80ms

});


// ============================================================
// ЕДИНАЯ СИСТЕМА УЧЕТА БИЛЕТОВ (ДЛЯ КЛИЕНТСКОЙ СТРАНИЦЫ)
// ============================================================

function getCurrentUser() {
    const rawData = localStorage.getItem('underdogg_user_data');
    if (!rawData) return null;
    
    try {
        const parsed = JSON.parse(rawData);
        if (Array.isArray(parsed)) {
            return parsed[parsed.length - 1];
        }
        return parsed;
    } catch (e) {
        console.error("Ошибка чтения данных пользователя", e);
        return null;
    }
}

function getTicketsKey(user) {
    if (!user) return null;
    const identifier = user.epic || user.casino || user.tg;
    return identifier ? 'tickets_epic_' + identifier.trim() : null;
}

function getUserTickets() {
    const user = getCurrentUser();
    if (!user) return { bronze: 0, silver: 0, gold: 0 };

    const key = getTicketsKey(user);
    if (!key) return { bronze: 0, silver: 0, gold: 0 };

    const rawTickets = localStorage.getItem(key);
    if (!rawTickets) {
        const initialTickets = { bronze: 0, silver: 0, gold: 0 };
        localStorage.setItem(key, JSON.stringify(initialTickets));
        return initialTickets;
    }

    try {
        return JSON.parse(rawTickets);
    } catch (e) {
        return { bronze: 0, silver: 0, gold: 0 };
    }
}

function showMyTicketsModal() {
    const user = getCurrentUser();
    
    if (!user) {
        alert("⚠️ Вы еще не зарегистрированы!");
        return;
    }

    const tickets = getUserTickets();

    // Заполняем счетчики билетов
    const bronzeEl = document.getElementById('myBronzeCount');
    const silverEl = document.getElementById('mySilverCount');
    const goldEl = document.getElementById('myGoldCount');
    const totalEl = document.getElementById('myTotalTicketsCount');

    if (bronzeEl) bronzeEl.textContent = tickets.bronze || 0;
    if (silverEl) silverEl.textContent = tickets.silver || 0;
    if (goldEl) goldEl.textContent = tickets.gold || 0;
    if (totalEl) {
        totalEl.textContent = (tickets.bronze || 0) + (tickets.silver || 0) + (tickets.gold || 0);
    }

    // Открываем модальное окно с билетами
    const modal = document.getElementById('myTicketsModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Слушатель для кнопки "Мои билеты"
document.addEventListener('DOMContentLoaded', () => {
    const myTicketsBtn = document.getElementById('myTicketsBtn');
    if (myTicketsBtn) {
        myTicketsBtn.addEventListener('click', showMyTicketsModal);
    }
});
