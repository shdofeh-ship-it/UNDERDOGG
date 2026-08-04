// ===== ЗАЩИТА ОТ БРАУЗЕРА (ФИНАЛ) =====
(function() {
    // Единственная правильная проверка на Telegram
    var isTelegram = !!(window.Telegram && window.Telegram.WebApp);
    
    if (!isTelegram) {
        // Убиваем старую страницу
        document.documentElement.innerHTML = '';
        
        // Вставляем новую с чёрным фоном
        document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Доступ закрыт</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    html, body {
                        width: 100%;
                        height: 100%;
                        background: #000000;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-family: 'Rajdhani', sans-serif;
                    }
                    .block {
                        max-width: 380px;
                        padding: 40px 24px;
                        border: 2px solid #ff2a4b;
                        border-radius: 20px;
                        background: #0d0103;
                        text-align: center;
                        box-shadow: 0 0 50px rgba(255,0,35,0.3);
                    }
                    .block .icon { font-size: 56px; margin-bottom: 16px; }
                    .block h2 {
                        font-family: 'Orbitron', sans-serif;
                        font-size: 20px;
                        color: #ff2a4b;
                        letter-spacing: 2px;
                        margin-bottom: 12px;
                    }
                    .block p {
                        color: #aaa;
                        line-height: 1.6;
                        font-size: 15px;
                        margin-bottom: 16px;
                    }
                    .block .bot-name {
                        color: #ff2a4b;
                        font-size: 18px;
                        font-weight: 700;
                    }
                    .block .btn {
                        display: inline-block;
                        padding: 12px 32px;
                        background: #ff2a4b;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 30px;
                        font-family: 'Orbitron', sans-serif;
                        font-size: 13px;
                        font-weight: 700;
                        letter-spacing: 1px;
                        box-shadow: 0 0 20px rgba(255,42,75,0.4);
                        transition: 0.3s;
                    }
                    .block .btn:hover {
                        box-shadow: 0 0 35px rgba(255,42,75,0.6);
                        transform: translateY(-2px);
                    }
                </style>
            </head>
            <body>
                <div class="block">
                    <div class="icon">🔒</div>
                    <h2>ДОСТУП ОТКРЫТ ТОЛЬКО ЧЕРЕЗ TELEGRAM</h2>
                    <p>Откройте это приложение через нашего бота:<br><span class="bot-name">@Undrd0gg_bot</span></p>
                    <a href="https://t.me/Undrd0gg_bot" target="_blank" class="btn">📱 ПЕРЕЙТИ В БОТА</a>
                </div>
            </body>
            </html>
        `);
        throw new Error('Доступ запрещён');
    }
})();
