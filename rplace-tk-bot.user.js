// ==UserScript==
// @name         rplace.tk Bot
// @namespace    https://github.com/stef1904berg/rplace-tk-bot
// @version      33
// @description  A bot for rplace.tk!
// @author       stef1904berg
// @match        https://rplace.tk/*
// @connect      *
// @icon         https://www.google.com/s2/favicons?sz=64&domain=rplace.tk
// @require	     https://cdn.jsdelivr.net/npm/toastify-js
// @resource     TOASTIFY_CSS https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css
// @updateURL    https://github.com/stef1904berg/rplace-tk-bot/raw/master/rplace-tk-bot.user.js
// @downloadURL  https://github.com/stef1904berg/rplace-tk-bot/raw/master/rplace-tk-bot.user.js
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM.xmlHttpRequest
// @run-at       document-body
// ==/UserScript==

var socket;
var order = undefined;
var currentOrderCanvas = document.createElement('canvas');
var currentOrderCtx = currentOrderCanvas.getContext('2d');
var currentPlaceCanvas = document.createElement('canvas');

// Global constants
const DEFAULT_TOAST_DURATION_MS = 10000;
const TEMPLATE_URL = "https://stef1904berg.nl/misc/orders.png"

const COLOR_MAPPINGS = {
    '#6D001A': 0,
    '#BE0039': 1,
    '#FF4500': 2,
    '#FFA800': 3,
    '#FFD635': 4,
    '#FFF8B8': 5,
    '#00A368': 6,
    '#00CC78': 7,
    '#7EED56': 8,
    '#00756F': 9,
    '#009EAA': 10,
    '#00CCC0': 11,
    '#2450A4': 12,
    '#3690EA': 13,
    '#51E9F4': 14,
    '#493AC1': 15,
    '#6A5CFF': 16,
    '#94B3FF': 17,
    '#811E9F': 18,
    '#B44AC0': 19,
    '#E4ABFF': 20,
    '#DE107F': 21,
    '#FF3881': 22,
    '#FF99AA': 23,
    '#6D482F': 24,
    '#9C6926': 25,
    '#FFB470': 26,
    '#000000': 27,
    '#515252': 28,
    '#898D90': 29,
    '#D4D7D9': 30,
    '#FFFFFF': 31
};

function showToast(text, duration = COOLDOWN, onToastClick = function () {
}) {
    let toast = Toastify({
        text: text,
        duration: duration,
        close: true,
        gravity: 'top',
        position: 'left',
        onClick: onToastClick
    })

    toast.showToast();
}

async function waitForCanvasLoad() {
    if (load) {
        return
    }
    setTimeout(waitForCanvasLoad, 1000)
}

let getRealWork = rgbaOrder => {
    let order = [];
    for (var i = 0; i < 4000000; i++) {
        if (rgbaOrder[(i * 4) + 3] !== 0) {
            order.push(i);
        }
    }
    return order;
};

let getPendingWork = (work, rgbaOrder, rgbaCanvas) => {
    let pendingWork = [];
    for (const i of work) {
        if (rgbaOrderToHex(i, rgbaOrder) !== rgbaOrderToHex(i, rgbaCanvas)) {
            pendingWork.push(i);
        }
    }
    return pendingWork;
};

(function () {
    GM_addStyle(GM_getResourceText('TOASTIFY_CSS'));

    window.onload = async function () {
        currentOrderCanvas.width = 2000;
        currentOrderCanvas.height = 2000;
        currentOrderCanvas.style.display = 'none';
        currentOrderCanvas = document.body.appendChild(currentOrderCanvas);
        currentPlaceCanvas.width = 2000;
        currentPlaceCanvas.height = 2000;
        currentPlaceCanvas.style.display = 'none';
        currentPlaceCanvas = document.body.appendChild(currentPlaceCanvas);

        let infoModal = document.getElementById('modal')
        let downloadButton = document.createElement('a')
        downloadButton.innerText = "Download canvas!"
        downloadButton.onclick = downloadCurrentCanvas
        downloadButton.id = 'download-canvas-button'
        downloadButton.download = 'canvas.png'
        infoModal.appendChild(downloadButton)

        muted = true

        showToast('Waiting for canvas to load...')
        await waitForCanvasLoad();
        showToast('Canvas loaded successfully!')

        await loadStaticImage();

        attemptPlace();

        setInterval(() => {
            loadStaticImage()
        }, 1000 * 60)
    }
})();

async function loadStaticImage() {
    currentOrderCtx = await getCanvasFromUrl(`${TEMPLATE_URL}?_=` + new Date().getTime(), currentOrderCanvas, 0, 0, true);
    order = getRealWork(currentOrderCtx.getImageData(0, 0, 2000, 2000).data);
    showToast(`Loaded new map, ${order.length} pixels in total`)
}

async function attemptPlace() {
    if (order === undefined) {
        setTimeout(attemptPlace, 2000); // probeer opnieuw in 2sec.
        return;
    }
    if (CD > Date.now()) {
        showToast(`Cooldown is present, waiting 1 second`, 1000)
        setTimeout(attemptPlace, 1000)
        return;
    }

    const rgbaOrder = currentOrderCtx.getImageData(0, 0, 2000, 2000).data;
    const rgbaCanvas = c.getImageData(0, 0, 2000, 2000).data;
    const work = getPendingWork(order, rgbaOrder, rgbaCanvas);

    if (work.length === 0) {
        showToast(`All pixels are in the right place! Trying again in ${COOLDOWN / 1000} sec...`)
        setTimeout(attemptPlace, COOLDOWN); // probeer opnieuw in 30sec.
        return;
    }

    const percentComplete = 100 - Math.ceil(work.length * 100 / order.length);
    const workRemaining = work.length;
    const idx = Math.floor(Math.random() * work.length);
    const i = work[idx];
    const placeX = i % 2000;
    const placeY = Math.floor(i / 2000);
    const hex = rgbaOrderToHex(i, rgbaOrder);

    showToast(`Trying to place pixel on ${placeX}, ${placeY}... (${percentComplete}% complete, ${workRemaining} pixels to go)`)

    if (COLOR_MAPPINGS[hex] === undefined) {
        console.log(`Invalid pixel on ${placeX},${placeY}: ${hex}`)
        showToast(`Invalid pixel on ${placeX},${placeY}: ${hex}`, 5000)
        setTimeout(attemptPlace, 500)
        return
    }

    await place(placeX, placeY, COLOR_MAPPINGS[hex]);
    showToast(`Placed pixel on ${placeX}, ${placeY}! Next pixel will be placed in ${COOLDOWN / 1000} seconds.`, DEFAULT_TOAST_DURATION_MS, _ => {
        x = placeX;
        y = placeY;
        z = 0.25;
        pos()
    })

    setTimeout(attemptPlace, COOLDOWN);
}

function place(placeX, placeY, color) {
    if (CD > Date.now()) return
    let lastActive = document.activeElement
    let originX = x
    let originY = y
    PEN = color
    x = placeX;
    y = placeY
    PEN = color;
    pok.classList.add("enabled");
    palette.style.transform = ""
    document.activeElement.blur()
    onCooldown = false
    document.body.onkeypress({keyCode: 13, isTrusted: true})
    palette.style.transform = "translateY(100%);"
    x = originX
    y = originY
    lastActive.focus()
}

function getCanvasFromUrl(url, canvas, x = 0, y = 0, clearCanvas = false) {
    return new Promise((resolve, reject) => {
        let loadImage = ctx => {
            GM.xmlHttpRequest({
                method: "GET",
                url: url,
                responseType: 'blob',
                onload: function (response) {
                    var urlCreator = window.URL || window.webkitURL;
                    var imageUrl = urlCreator.createObjectURL(this.response);
                    var img = new Image();
                    img.onload = () => {
                        if (clearCanvas) {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }
                        ctx.drawImage(img, x, y);
                        resolve(ctx);
                    };
                    img.onerror = () => {
                        showToast('There was an error when retrieving the map. Trying again in 3 seconds...')
                        setTimeout(() => loadImage(ctx), 3000);
                    };
                    img.src = imageUrl;
                }
            })
        };
        loadImage(canvas.getContext('2d'));
    });
}

function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

let rgbaOrderToHex = (i, rgbaOrder) =>
    rgbToHex(rgbaOrder[i * 4], rgbaOrder[i * 4 + 1], rgbaOrder[i * 4 + 2]);

function downloadCurrentCanvas() {
    document.getElementById("download-canvas-button").download = "canvas.png";
    document.getElementById("download-canvas-button").href = document.getElementById("canvas").toDataURL("image/png").replace(/^data:image\/[^;]/, 'data:application/octet-stream');
}