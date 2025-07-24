// --- Globale variabler ---
const world = document.getElementById('world');
let cubes = [];
const CUBE_SIZE = 200;
const STICKMAN_COLOR = '#0f380f';
const BORDER_ZONE = 20;

// --- Hovedklassen for en kube ---
class Cube {
    constructor(characterType, index) {
        this.index = index;
        this.characterType = characterType;
        this.element = this.createCubeElement();
        this.canvas = this.element.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CUBE_SIZE;
        this.canvas.height = CUBE_SIZE;

        // Utvidet tilstandsmaskin
        this.state = 'walking'; // ... , chilling
        this.timer = 0;
        this.animationFrame = Math.floor(Math.random() * 100);

        const personalities = {
            'Stickman': { speed: 0.7, power: 5, role: 'guitar', friendliness: 7 },
            'Dash': { speed: 1.2, power: 4, role: 'gamer', friendliness: 5 },
            'Ton': { speed: 0.5, power: 8, role: 'sleeper', friendliness: 3 },
            'Handy': { speed: 0.8, power: 6, role: 'drums', friendliness: 6 }
        };
        this.personality = personalities[this.characterType];
        
        this.x = CUBE_SIZE / 2;
        this.y = CUBE_SIZE - 40;
        this.vx = (Math.random() < 0.5 ? 1 : -1) * this.personality.speed;

        world.appendChild(this.element);
        this.startAnimation();
    }

    createCubeElement() {
        const cubeWrapper = document.createElement('div');
        cubeWrapper.className = 'cube-case p-4 rounded-2xl';
        cubeWrapper.innerHTML = `
            <div class="screen w-[${CUBE_SIZE}px] h-[${CUBE_SIZE}px] rounded-lg overflow-hidden">
                <canvas></canvas>
            </div>
            <p class="text-center text-gray-700 text-2xl mt-2">${this.characterType}</p>
        `;
        return cubeWrapper;
    }

    startAnimation() {
        const animate = () => {
            this.update();
            this.draw();
            requestAnimationFrame(animate);
        };
        animate();
    }

    update() {
        this.animationFrame++;
        if (this.timer > 0) {
            this.timer--;
            if (this.timer <= 0) {
                if(['meeting', 'victory', 'defeat', 'band_practice', 'chilling', 'dancing', 'trading'].includes(this.state)) {
                    this.vx *= -1;
                }
                this.setState('walking');
            }
            return;
        }

        if (['walking','exploring','jumping'].includes(this.state)) {
            this.x += this.vx;
            this.checkForInteractions();
        }

        if (['walking','exploring'].includes(this.state) && Math.random() < 0.002) {
            this.setState('jumping', 40);
        }
    }

    setState(newState, duration = 0) {
        this.state = newState;
        this.timer = duration;
    }

    checkForInteractions() {
        const rightNeighbor = cubes[this.index + 1];
        if (this.vx > 0 && this.x > CUBE_SIZE - BORDER_ZONE && rightNeighbor) {
            if (rightNeighbor.x < BORDER_ZONE && ['walking','exploring','jumping'].includes(rightNeighbor.state)) {
                this.initiateMeeting(rightNeighbor);
                return;
            }
        }
        const leftNeighbor = cubes[this.index - 1];
        if (this.vx < 0 && this.x < BORDER_ZONE && leftNeighbor) {
            if (leftNeighbor.x > CUBE_SIZE - BORDER_ZONE && ['walking','exploring','jumping'].includes(leftNeighbor.state)) {
                this.initiateMeeting(leftNeighbor);
                return;
            }
        }

        if ((this.x > CUBE_SIZE - BORDER_ZONE && !rightNeighbor) || (this.x < BORDER_ZONE && !leftNeighbor)) {
            this.vx *= -1;
        } 
        else if (Math.random() < 0.008) {
            this.startRandomSoloActivity();
        }
    }
    
    initiateMeeting(partner) {
        const possibleMeetings = ['fight', 'chilling']; // De kan alltid slåss eller chille
        if (myRole !== 'sleeper' && partnerRole !== 'sleeper') {
            possibleMeetings.push('dance');
        }
        possibleMeetings.push('trade');
        const myRole = this.personality.role;
        const partnerRole = partner.personality.role;

        // Sjekk om de kan spille i band
        if ((myRole === 'guitar' && partnerRole === 'drums') || (myRole === 'drums' && partnerRole === 'guitar')) {
            possibleMeetings.push('band_practice');
        }

        // Velg en tilfeldig interaksjon
        const choice = possibleMeetings[Math.floor(Math.random() * possibleMeetings.length)];

        switch(choice) {
            case 'fight':
                this.startFight(partner);
                break;
            case 'band_practice':
                this.setState('band_practice', 350);
                partner.setState('band_practice', 350);
                break;
            case 'chilling':
                this.setState('chilling', 300);
                partner.setState('chilling', 300);
                break;
            case 'dance':
                this.setState('dancing', 250);
                partner.setState('dancing', 250);
                break;
            case 'trade':
                this.setState('trading', 180);
                partner.setState('trading', 180);
                break;
        }
    }

    startFight(partner) {
        const meetingTime = 250;
        this.setState('meeting', meetingTime);
        partner.setState('meeting', meetingTime);

        setTimeout(() => {
            if (this.personality.power * Math.random() > partner.personality.power * Math.random()) {
                this.setState('victory', 150);
                partner.setState('defeat', 150);
            } else {
                partner.setState('victory', 150);
                this.setState('defeat', 150);
            }
        }, meetingTime * (1000/60));
    }

    startRandomSoloActivity() {
        const soloStates = ['idle', 'working', 'sleeping', 'gaming', 'dancing', 'exploring'];
        let randomState = soloStates[Math.floor(Math.random() * soloStates.length)];
        
        if (randomState === 'gaming' && this.personality.role !== 'gamer') randomState = 'idle';
        if (randomState === 'sleeping' && this.personality.role !== 'sleeper') randomState = 'idle';
        if (randomState === 'working' && !['Ton', 'Handy', 'Stickman'].includes(this.characterType)) randomState = 'idle';

        this.setState(randomState, 240);
    }

    // --- Tegnefunksjoner ---
    draw() {
        this.ctx.clearRect(0, 0, CUBE_SIZE, CUBE_SIZE);
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.scale(this.vx > 0 ? 1 : -1, 1);
        
        this.ctx.strokeStyle = STICKMAN_COLOR;
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';

        switch (this.state) {
            case 'walking': this.drawWalking(); break;
            case 'idle': this.drawIdle(); break;
            case 'working': this.drawWorking(); break;
            case 'meeting': this.drawMeeting(); break;
            case 'victory': this.drawVictory(); break;
            case 'defeat': this.drawDefeat(); break;
            case 'sleeping': this.drawSleeping(); break;
            case 'gaming': this.drawGaming(); break;
            case 'band_practice': this.drawBandPractice(); break;
            case 'chilling': this.drawChilling(); break;
            case 'dancing': this.drawDancing(); break;
            case 'trading': this.drawTrading(); break;
            case 'exploring': this.drawExploring(); break;
            case 'jumping': this.drawJumping(); break;
        }
        this.ctx.restore();
    }

    drawStickman(parts) {
        const p = { headY: 0, arm1: {angle:0, len: 15}, arm2: null, leg1Angle: Math.PI / 4, leg2Angle: -Math.PI / 4, ...parts };
        const ctx = this.ctx;
        ctx.beginPath(); ctx.arc(0, -35 + p.headY, 8, 0, Math.PI * 2); ctx.stroke(); // Hode
        ctx.beginPath(); ctx.moveTo(0, -27); ctx.lineTo(0, -10); ctx.stroke(); // Kropp
        ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(p.arm1.len * Math.cos(p.arm1.angle), -22 + p.arm1.len * Math.sin(p.arm1.angle)); ctx.stroke(); // Arm 1
        if(p.arm2) { ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(p.arm2.len * Math.cos(p.arm2.angle), -22 + p.arm2.len * Math.sin(p.arm2.angle)); ctx.stroke(); } // Arm 2
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(12 * Math.cos(p.leg1Angle), -10 + 12 * Math.sin(p.leg1Angle)); ctx.moveTo(0, -10); ctx.lineTo(12 * Math.cos(p.leg2Angle), -10 + 12 * Math.sin(p.leg2Angle)); ctx.stroke(); // Bein
    }

    drawWalking() { const c = Math.sin(this.animationFrame * 0.2); this.drawStickman({ leg1Angle: c, leg2Angle: -c }); }
    drawIdle() { const c = Math.sin(this.animationFrame * 0.05); this.drawStickman({ headY: c * 2, arm1: {angle: c * 0.2, len: 15} }); }
    drawMeeting() { const c = Math.sin(this.animationFrame * 0.5); this.drawStickman({ arm1: {angle: c * 0.8, len: 15}, leg1Angle: Math.PI / 6, leg2Angle: -Math.PI / 6 }); }
    drawVictory() { const c = Math.abs(Math.sin(this.animationFrame * 0.2)); this.drawStickman({ headY: c * -15, arm1: {angle: Math.PI * 1.5, len: 15}, leg1Angle: Math.PI / 5, leg2Angle: -Math.PI / 5}); }
    drawDefeat() { this.ctx.translate(0, 15); const c = Math.sin(this.animationFrame * 0.1); this.drawStickman({ headY: 5, arm1: {angle: Math.PI/2 + c * 0.2, len: 15}, leg1Angle: Math.PI / 2, leg2Angle: -Math.PI / 2 }); }
    
    drawSleeping() {
        this.ctx.translate(0, 5); this.ctx.rotate(-Math.PI / 2);
        this.drawStickman({leg1Angle: 0, leg2Angle: 0});
        this.ctx.save(); this.ctx.scale(-1, 1); this.ctx.font = "20px VT323"; this.ctx.fillText("Z", -20, -25 + Math.sin(this.animationFrame * 0.1) * 5); this.ctx.fillText("z", -30, -35 + Math.sin(this.animationFrame * 0.1) * 5); this.ctx.restore();
    }

    drawGaming() {
        this.ctx.translate(0, 15); // Sit
        const c = Math.sin(this.animationFrame * 0.8);
        this.drawStickman({ arm1: {angle: 0.5, len: 10}, arm2: {angle: -0.5, len: 10}, leg1Angle: Math.PI/2, leg2Angle: -Math.PI/2 });
        this.ctx.beginPath(); this.ctx.rect(10, -20 + c, 10, 5); this.ctx.stroke();
    }

    drawChilling() {
        // Tegn sofaen
        this.ctx.beginPath();
        this.ctx.rect(-CUBE_SIZE, 0, CUBE_SIZE * 2, 10); // Sete
        this.ctx.rect(-10, -20, 20, 20); // Rygg
        this.ctx.stroke();
        
        // Sett karakteren på sofaen
        this.ctx.translate(this.vx > 0 ? -25 : 25, 0);
        const c = Math.sin(this.animationFrame * 0.2);
        this.drawStickman({ arm1: {angle: -1.5 + c * 0.5, len: 12}, leg1Angle: Math.PI/2.5, leg2Angle: -Math.PI/2.5 });
        
        // Tegn glasset
        this.ctx.beginPath();
        this.ctx.rect(10, -35 + c * 5, 5, 8);
        this.ctx.stroke();
    }

    drawBandPractice() {
        const c = Math.sin(this.animationFrame * 0.4);
        if (this.personality.role === 'guitar') {
            this.drawStickman({ arm1: {angle: -0.5 + c * 0.2, len: 15}, arm2: {angle: 0.5, len: 15}, leg1Angle: Math.PI / 6, leg2Angle: -Math.PI / 6 });
            this.ctx.beginPath(); this.ctx.ellipse(15, -5, 10, 15, Math.PI / 4, 0, 2 * Math.PI); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.moveTo(0, -20); this.ctx.lineTo(-20, -30); this.ctx.stroke();
        } else if (this.personality.role === 'drums') {
            this.ctx.translate(0, 15);
            this.drawStickman({ arm1: {angle: 0.8 + c * 0.5, len: 15}, arm2: {angle: -0.8 - c * 0.5, len: 15}, leg1Angle: Math.PI / 2, leg2Angle: -Math.PI / 2 });
            this.ctx.beginPath(); this.ctx.arc(20, 0, 8, 0, Math.PI * 2); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.rect(30, -25, 2, 20); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.arc(31, -25, 10, Math.PI, Math.PI * 2); this.ctx.stroke();
        }
    }

    drawDancing() {
        const c = Math.sin(this.animationFrame * 0.5);
        this.drawStickman({ headY: c * 2, arm1: {angle: Math.PI/2 + c, len: 15}, arm2: {angle: -Math.PI/2 - c, len: 15}, leg1Angle: c, leg2Angle: -c });
    }

    drawTrading() {
        const c = Math.sin(this.animationFrame * 0.3);
        this.drawStickman({ arm1: {angle: 0.3 + c * 0.1, len: 15}, arm2: {angle: -0.3 - c * 0.1, len: 15}, leg1Angle: 0.2, leg2Angle: -0.2 });
    }

    drawExploring() {
        const c = Math.sin(this.animationFrame * 0.2);
        this.drawStickman({ headY: Math.sin(this.animationFrame * 0.05) * 2, leg1Angle: c, leg2Angle: -c });
    }

    drawJumping() {
        const j = Math.abs(Math.sin(this.animationFrame * 0.3)) * 20;
        this.ctx.translate(0, -j);
        const c = Math.sin(this.animationFrame * 0.2);
        this.drawStickman({ leg1Angle: c, leg2Angle: -c });
    }

    drawWorking() {
        const c = Math.sin(this.animationFrame * 0.15);
        switch(this.characterType) {
            case 'Ton': this.drawStickman({ arm1: {angle: Math.PI + c * 0.4, len: 15}, leg1Angle: Math.PI/5, leg2Angle: -Math.PI/5 }); break;
            case 'Dash': this.ctx.translate(0, 10); this.drawStickman({ arm1: {angle: 0.5, len: 15}, leg1Angle: -0.2, leg2Angle: Math.PI/2 }); break;
            case 'Handy': this.ctx.translate(0, 15); this.drawStickman({ leg1Angle: Math.PI/2, leg2Angle: -Math.PI/2 }); this.ctx.strokeRect(10, -15, 10, 5); break;
            default: this.drawStickman({ arm1: {angle: -0.5 + c * 0.5, len: 15} }); this.ctx.beginPath(); this.ctx.arc(10, -40 + Math.sin(this.animationFrame * 0.2) * 10, 3, 0, Math.PI * 2); this.ctx.arc(-5, -40 + Math.cos(this.animationFrame * 0.2) * 10, 3, 0, Math.PI * 2); this.ctx.fill(); break;
        }
    }
}

// --- Globale funksjoner (tilgjengelig fra HTML) ---
function addCube(characterType) {
    const newIndex = cubes.length;
    const newCube = new Cube(characterType, newIndex);
    cubes.push(newCube);
}

function removeAllCubes() {
    world.innerHTML = '';
    cubes = [];
}

// --- Initialisering ---
// Starter med et par kuber for å vise funksjonalitet
addCube('Stickman');
addCube('Handy');
