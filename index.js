const imgURL = require('./assets/heart.png');
const logoURL = require('./assets/logo.svg');

var SimplexNoise = require('simplex-noise'),
    simplex = new SimplexNoise(Math.random);

function loadImage(url) {
    return new Promise(r => {
        let i = new Image();
        i.onload = (() => r(i));
        i.src = url;
    });
}

setInterval(() => {
    simplex = new SimplexNoise(Math.random);
}, 2000);

var mouseX = 0;
var mouseY = 0;

let img = null;
let logo = null;
let x = 0;

let hearts = [];
let repulsors = [];

const maxSpeed = 2;
let logoSize = 250;
let tresh = 250;
let logoRepulsor = null;
let mouseRepulsor = null;
const size = 40;

document.addEventListener('DOMContentLoaded', () => {
    const elLogo = document.querySelector('.logo');
    console.log(elLogo)

    logoSize = parseFloat(window.getComputedStyle(elLogo).width);
    console.log(logoSize)
    tresh = logoSize * 1;
})

const fallingParams = {
    n: 30,
    gravity: 1,
    noise: 0,
    edgeFun: () => (Math.random() * canvas.width * 0.4) + canvas.width * 0.2
}

const wiggleParams = {
    n: 1,
    gravity: 0,
    noise: 1,
    edgeFun: () => Math.random() * canvas.width

}

const paramOptions = [wiggleParams, fallingParams]

var params = paramOptions[Math.floor(Math.random() * (paramOptions.length))];
console.log(params)


const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const c = canvas.getContext('2d');
c.fillStyle = "#ffffff";

class Particle {
    constructor(x, y) {
        this.pos = {
            x: x,
            y: y
        };
        this.acc = {
            x: 0,
            y: 0
        };
        this.vel = {
            x: 0,
            y: 0
        };
        this.mass = Math.max(0.1, Math.random());
    }

    applyForce(fx, fy) {
        this.acc.x += fx * this.mass;
        this.acc.y += fy * this.mass;
    }

    checkEdges() {
        if (this.pos.x > canvas.width + size / 2) {
            this.pos.x = -size / 2;
        }
        if (this.pos.x < -size / 2) {
            this.pos.x = canvas.width + size / 2;
        }
        if (this.pos.y > canvas.height + size / 2) {
            this.pos.y = -size / 2;
            this.pos.x = params.edgeFun();
            this.vel.y = 0;
        }
        if (this.pos.y < -size / 2) {
            this.pos.y = canvas.height + size / 2;
        }
    }

    draw() {
        this.checkEdges();

        this.vel.x += this.acc.x;
        this.vel.y += this.acc.y;

        this.vel.x *= 0.95;
        this.vel.y *= 0.95;

        this.vel.x = Math.min(this.vel.x, maxSpeed);
        this.vel.y = Math.min(this.vel.y, maxSpeed);

        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        c.drawImage(img, this.pos.x, this.pos.y, size, size);
        this.acc.x = 0;
        this.acc.y = 0;
    }
}

class Repulsor {
    constructor(x, y, burst = false, visible = false) {
        this.pos = {
            x: x,
            y: y
        };
        this.lifeTime = burst ? 2 : 1000000000000;
        this.life = 0;
        this.visible = visible;
    }

    repulse(particles) {
        particles.forEach(p => {
            let rx = 0;
            let ry = 0;

            const distX = Math.abs(this.pos.x - p.pos.x);
            const distY = Math.abs(this.pos.y - p.pos.y);

            if (distX * distX + distY * distY < tresh * tresh) {
                const dirx = (p.pos.x - this.pos.x) / distX;
                const diry = (p.pos.y - this.pos.y) / distY;

                rx = 1 / dirx;
                ry = 1 / diry;
            }

            p.applyForce(rx, ry);
        })
    }

    draw() {
        if (this.life > this.lifeTime) {
            if (repulsors.indexOf(this) > -1) {
                repulsors.splice(repulsors.indexOf(this), 1); 

            }
        }

        this.life += 1;
        if (this.visible) {
            //c.drawImage(logo, this.pos.x - logoSize / 2, this.pos.y - logoSize / 2, logoSize, logoSize);
        }
    }
}

function draw() {
    c.clearRect(0, 0, window.innerWidth, window.innerHeight)
    x += 0.001;

    hearts.forEach(h => h.applyForce(0.01, 0.5) * params.gravity )
    hearts.forEach(h => h.applyForce(simplex.noise2D(h.pos.x / 20, 0) * params.noise, simplex.noise2D(0, h.pos.y / 20) * params.noise))

    repulsors.forEach(r => r.repulse(hearts));
    repulsors.forEach(r => r.draw());
    
    hearts.forEach(h => h.draw())

    requestAnimationFrame(draw)
}

async function main() {
    img = await loadImage(imgURL);
    logo = await loadImage(logoURL);

    const n = params.n;
    for (let i = 0; i < n; i++) {
        const p = new Particle(Math.random() * canvas.width, Math.random() * canvas.height);
        hearts.push(p);
    }

    logoRepulsor = new Repulsor(canvas.width / 2, canvas.height / 2 - 40, false, true);
    repulsors.push(logoRepulsor);

    draw();
}

main();

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!mouseRepulsor) {
        mouseRepulsor = new Repulsor(mouseX, mouseY, false, false);
        repulsors.push(mouseRepulsor);
    }

    mouseRepulsor.pos.x = mouseX;
    mouseRepulsor.pos.y = mouseY;
})

document.addEventListener('mousedown', (e) => {    
    let repulsor = new Repulsor(e.clientX, e.clientY, true, false);
    repulsors.push(repulsor);
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    logoRepulsor.pos.x = canvas.width / 2;
    logoRepulsor.pos.y = canvas.height / 2 - 40;

    const elLogo = document.querySelector('.logo');

    logoSize = parseFloat(window.getComputedStyle(elLogo).width);
    tresh = logoSize * 1;
})