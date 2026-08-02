console.log('UNDERDOGG v2 started');
const fill = document.querySelector(".loading-fill");
const percent = document.getElementById("loadingPercent");

let progress = 0;

const loading = setInterval(() => {

    progress++;

    fill.style.width = progress + "%";
    percent.textContent = progress;

    if(progress >= 100){

    clearInterval(loading);

    setTimeout(()=>{
        document.querySelector(".enter-btn").classList.add("ready");
    },400);

    }
