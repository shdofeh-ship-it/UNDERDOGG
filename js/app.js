console.log('UNDERDOGG v2 started');

// Ждём, пока вся страница загрузится
document.addEventListener("DOMContentLoaded", function() {

    const fill = document.querySelector(".loading-fill");
    const percent = document.getElementById("loadingPercent");
    const btn = document.querySelector(".enter-btn");

    // Проверяем, что элементы найдены
    if (!fill || !percent) {
        console.error("Элементы загрузки не найдены!");
        return;
    }

    let progress = 0;

    const loading = setInterval(() => {
        progress++;

        // Ограничиваем до 100
        if (progress > 100) progress = 100;

        fill.style.width = progress + "%";
        percent.textContent = progress;

        if (progress >= 100) {
            clearInterval(loading);

            // Показываем кнопку через 0.4 сек
            setTimeout(() => {
                if (btn) btn.classList.add("ready");
            }, 400);
        }

    }, 50); // 50ms — скорость загрузки

});
