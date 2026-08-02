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
