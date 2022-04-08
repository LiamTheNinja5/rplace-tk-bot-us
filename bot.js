import fetch from 'node-fetch';
import getPixels from "get-pixels";
import WebSocket from 'ws';

const PREFIX = process.env.PREFIX || "rplace-tk"
const VERSION_NUMBER = 11;

console.log(`PlaceNL headless client V${VERSION_NUMBER}`);


const args = process.argv.slice(2);

const COMMANDO_SERVER = args[0] || 'placenl.noahvdaa.me'

console.log('Using Commando Server: ' + COMMANDO_SERVER)

let socket;
let placeSocket;

let currentOrders;
let currentOrderList;

let lastPlacedPixel = {x: -1, y: -1, color: -1}

const WIDTH = 2000;
const HEIGHT = 2000;


// eigenlijk moet er maar 1 van deze lijst zijn, maar ik heb nog geen idee hoe ik dat moet oplossen op dit moment
const VALID_COLORS = ['#6D001A', '#BE0039', '#FF4500', '#FFA800', '#FFD635', '#FFF8B8', '#00A368', '#00CC78', '#7EED56', '#00756F', '#009EAA', '#00CCC0', '#2450A4', '#3690EA', '#51E9F4', '#493AC1', '#6A5CFF', '#94B3FF', '#811E9F', '#B44AC0', '#E4ABFF', '#DE107F', '#FF3881', '#FF99AA', '#6D482F', '#9C6926', '#FFB470', '#000000', '#515252', '#898D90', '#D4D7D9', '#FFFFFF'];
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

let canvasLoaded = false
let initialCanvasLoaded = false

// Load initial canvas, dont think this is a good place to load it tho...
let canvas
await fetch('https://rplace.tk/place').then(a => a.arrayBuffer()).then(a => {
    canvas = new Uint8Array(a)
    initialCanvasLoaded = true
})


let getRealWork = rgbaOrder => {
    let order = [];
    for (var i = 0; i < 4000000; i++) {
        if (rgbaOrder[(i * 4) + 3] !== 0) {
            order.push(i);
        }
    }
    return order;
};

let getPendingWork = (work, rgbaOrder, canvas) => {
    let pendingWork = [];
    for (const i of work) {
        if (rgbaOrderToHex(i, rgbaOrder) !== VALID_COLORS[canvas[i]]) {
            pendingWork.push(i);
        }
    }
    return pendingWork;
};

(async function () {
    connectPlaceTkSocket()
    connectSocket()

    startPlacement();
})();

function startPlacement() {

    let delay = 0
    setTimeout(() => attemptPlace(), delay * 1000);
}

function connectPlaceTkSocket() {
    console.log('Verbonden met rplace.tk websocket...')

    placeSocket = new WebSocket('wss://server.rplace.tk:1291/')

    placeSocket.onopen = function () {
        console.log('Verbonden met rplace.tk websocket!')
    }

    placeSocket.onerror = function (e) {
        console.error('rplace.tk socket error: ' + e.message)
    }

    placeSocket.onmessage = async function ({data}) {

        let packet = new DataView(await data.buffer.slice(2))

        let code = packet.getUint8(0)

        // inladen pixel veranderingen vanuit websocket, ik heb geen idee of dit nu de bedoeling is of niet
        // als het in het canvas word geladen zijn er meer pixels die veranderd moeten worden dat als het niet word geladen

        // stupidPacket moet worden aangemaakt omdat data.buffer.slice(2) bij packet wel nodig is, maar als je 'packet' gebruikt om de code uit te lezen veranderd die om de minuut
        let stupidPacket = new DataView(await data.buffer)
        if (stupidPacket.getUint8(0) === 2) {
            let i = 1, boardI = 0
            while (i < packet.byteLength) {
                let cell = packet.getUint8(i++)
                let c = cell >> 6
                if (c === 1) c = packet.getUint8(i++)
                else if (c === 2) c = packet.getUint16(i++), i++
                else if (c === 3) c = packet.getUint32(i++), i += 3
                boardI += c
                canvas[boardI++] = cell & 63
            }
            canvasLoaded = true
        }

        // dump incoming pixels into the canvas
        if (code === 6) {
            let i = 0
            while (i < packet.byteLength - 2) {
                let location = packet.getUint32(i += 1)
                let color = packet.getUint8(i += 4)
                canvas[location] = color

                let x = location % WIDTH
                let y = Math.floor(location / WIDTH)
                if (lastPlacedPixel.x === x && lastPlacedPixel.y === y && lastPlacedPixel.color === color) {
                    console.log(`Pixel succesvol geplaatst op: ${x}, ${y}`)
                    lastPlacedPixel = {x: -1, y: -1, color: -1}
                }
            }
        }


    }

    placeSocket.onclose = function (e) {
        console.warn(`rplace.tk server heeft de verbinding verbroken: ${e.reason}`)
        console.error('rplace.tk, Socketfout: ', e.reason);
        socket.close();
        setTimeout(connectPlaceTkSocket, 1000);
    };
}

function connectSocket() {
    console.log('Verbinden met PlaceNL server...')

    socket = new WebSocket(`wss://${COMMANDO_SERVER}/api/ws`);

    socket.onerror = function (e) {
        console.error("Socket error: " + e.message)
    }

    socket.onopen = function () {
        console.log('Verbonden met PlaceNL server!')
        socket.send(JSON.stringify({type: 'getmap'}));
        socket.send(JSON.stringify({type: 'brand', brand: `nodeheadless-${PREFIX}-V${VERSION_NUMBER}`}));
    };

    socket.onmessage = async function (message) {
        var data;
        try {
            data = JSON.parse(message.data);
        } catch (e) {
            return;
        }

        switch (data.type.toLowerCase()) {
            case 'map':
                console.log(`Nieuwe map geladen (reden: ${data.reason ? data.reason : 'verbonden met server'})`)
                currentOrders = await getMapFromUrl(`https://${COMMANDO_SERVER}/maps/${data.data}`);
                currentOrderList = getRealWork(currentOrders.data);
                break;
            default:
                break;
        }
    };

    socket.onclose = function (e) {
        console.warn(`PlaceNL server heeft de verbinding verbroken: ${e.reason}`)
        console.error('PlaceNL, Socketfout: ', e.reason);
        socket.close();
        setTimeout(connectSocket, 1000);
    };
}

async function attemptPlace(accessTokenHolder) {
    let retry = () => attemptPlace();
    if (currentOrderList === undefined || !canvasLoaded) {
        setTimeout(retry, 5000); // probeer opnieuw in 10sec.
        return;
    }

    const rgbaOrder = currentOrders.data;
    const work = getPendingWork(currentOrderList, rgbaOrder, canvas);

    if (work.length === 0) {
        console.log(`Alle pixels staan al op de goede plaats! Opnieuw proberen in 10 sec...`);
        setTimeout(retry, 10000); // probeer opnieuw in 10sec.
        return;
    }

    const percentComplete = 100 - Math.ceil(work.length * 100 / currentOrderList.length);
    const workRemaining = work.length;
    const idx = Math.floor(Math.random() * work.length);
    const i = work[idx];
    const x = i % 2000;
    const y = Math.floor(i / 2000);
    const hex = rgbaOrderToHex(i, rgbaOrder);

    console.log(`Proberen pixel te plaatsen op ${x}, ${y}... (${percentComplete}% compleet, nog ${workRemaining} over)`);

    place(x, y, COLOR_MAPPINGS[hex])
    canvas[i] = COLOR_MAPPINGS[hex]

    setTimeout(retry, 11000)
}

function place(x, y, color) {
    // prepare and send packet to rplace.tk
    let placePixelPacket = new DataView(new Uint8Array(6).buffer)
    placePixelPacket.setUint8(0, 4)
    placePixelPacket.setUint32(1, Math.floor(x) + Math.floor(y) * WIDTH)
    placePixelPacket.setUint8(5, color)

    placeSocket.send(placePixelPacket)
    lastPlacedPixel = {x: x, y: y, color: color}

    // send pixel job to command server
    socket.send(JSON.stringify({type: 'placepixel', x, y, color}));

}

function getMapFromUrl(url) {
    return new Promise((resolve, reject) => {
        getPixels(url, function (err, pixels) {
            if (err) {
                console.log("Bad image path")
                reject()
                return
            }
            resolve(pixels)
        })
    });
}

function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

let rgbaOrderToHex = (i, rgbaOrder) =>
    rgbToHex(rgbaOrder[i * 4], rgbaOrder[i * 4 + 1], rgbaOrder[i * 4 + 2]);
