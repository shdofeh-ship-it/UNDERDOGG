// ============================================================
// ЖЁСТКАЯ ЗАЩИТА: сайт открывается ТОЛЬКО внутри Telegram-бота
// @Undrd0gg_bot. При открытии из обычного браузера — чёрный
// экран с сообщением.
// ============================================================
(function () {
    // Прячем страницу сразу же, чтобы не было "мигания" контента,
    // пока грузится Telegram WebApp SDK.
    document.documentElement.style.display = 'none';

    var MAX_WAIT_MS = 3000;   // сколько максимум ждём инициализацию Telegram SDK
    var CHECK_INTERVAL_MS = 50;
    var waited = 0;

    function showBlocked() {
        document.open();
        document.write(
            '<!doctype html><html><head><meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1">' +
            '<style>' +
            'html,body{margin:0;height:100%;background:#000;color:#fff;' +
            'display:flex;align-items:center;justify-content:center;' +
            'font-family:Arial,Helvetica,sans-serif;font-size:22px;' +
            'text-align:center;padding:24px;box-sizing:border-box;}' +
            '</style></head><body>' +
            'Доступ разрешён только в Telegram @Undrd0gg_bot' +
            '</body></html>'
        );
        document.close();
        throw new Error('UNDERDOGG protect.js: доступ заблокирован (не Telegram)');
    }

    function showPage() {
        document.documentElement.style.display = '';
    }

    function isInsideTelegram() {
        var tg = window.Telegram && window.Telegram.WebApp;
        return !!(tg && tg.initData && tg.initData.length > 20);
    }

    function check() {
        if (isInsideTelegram()) {
            showPage();
            return;
        }

        waited += CHECK_INTERVAL_MS;
        if (waited >= MAX_WAIT_MS) {
            showBlocked();
            return;
        }

        setTimeout(check, CHECK_INTERVAL_MS);
    }

    // Как только DOM готов достаточно, чтобы иметь <html>, начинаем проверку.
    check();
})();
