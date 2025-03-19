// render.js
const decalImage = new Image();
decalImage.src = 'decal.png';
const shooterImage = new Image();
shooterImage.src = 'shooter.png';
const shooter2Image = new Image();
shooter2Image.src = 'shooter2.png';
const deadImage = new Image();
deadImage.src = 'dead.png';
const leonImage = new Image();
leonImage.src = 'leon.png';
const leonDeadImage = new Image();
leonDeadImage.src = 'leon_dead.png';
const avatarImage = new Image();
avatarImage.src = 'avatar.png';
const avatar01Image = new Image();
avatar01Image.src = 'avatar01.png';
const avatar02Image = new Image();
avatar02Image.src = 'avatar02.png';
const avatar03Image = new Image();
avatar03Image.src = 'avatar03.png';
const avatar2Image = new Image();
avatar2Image.src = 'avatar2.png';
const grenadeImage = new Image();
grenadeImage.src = 'grenade.png';
const overlayImage = new Image();
overlayImage.src = 'overlay.png';
const m4Image = new Image();
m4Image.src = 'm4.png';
const bulletImage = new Image();
bulletImage.src = 'bullet.png';
const grenadeHEImage = new Image();
grenadeHEImage.src = 'grenadeHE.png';

let decals = [];

function render(ctx, player, enemies, projectiles, bloodParticles, mapImage, canvas, boxes) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mapImage.complete) {
        ctx.drawImage(mapImage, 0, 0, 1280, 1280);
    }

    if (decals.length > 100) {
        decals.shift();
    }
    decals.forEach(decal => {
        ctx.save();
        ctx.translate(decal.x, decal.y);
        ctx.rotate(decal.rotation);
        if (decal.image) {
            if (decal.image.complete && decal.image.naturalWidth > 0) {
                const size = decal.lifetime === 2 ? 64 : 100;
                ctx.drawImage(decal.image, -size / 2, -size / 2, size, size);
                if (decal.lifetime !== undefined) {
                    decal.lifetime--;
                    if (decal.lifetime <= 0) {
                        decals.splice(decals.indexOf(decal), 1);
                    }
                }
            }
        } else {
            ctx.drawImage(decalImage, -32, -32, 64, 64);
        }
        ctx.restore();
    });

    enemies.forEach(enemy => {
        if (enemy.dead) {
            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            if (deadImage.complete && deadImage.naturalWidth > 0) {
                if (enemy.deathAngle !== undefined) {
                    ctx.rotate(enemy.deathAngle);
                }
                ctx.drawImage(deadImage, -23, -23, 46, 46);
            } else {
                ctx.fillStyle = '#404040';
                ctx.beginPath();
                ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    });

    enemies.forEach(enemy => {
        if (!enemy.dead) {
            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            const sprite = (enemy.type === "B" || enemy.type === "E") ? shooter2Image : shooterImage;
            if (sprite.complete && sprite.naturalWidth > 0) {
                ctx.rotate(enemy.firingAngle);
                ctx.drawImage(sprite, -16, -16, 32, 32);
            } else {
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    });

    ctx.save();
    ctx.translate(player.x, player.y);
    if (player.hp > 0) {
        if (leonImage.complete && leonImage.naturalWidth > 0) {
            ctx.rotate(player.facingAngle);
            ctx.drawImage(leonImage, -16, -16, 32, 32);
        } else {
            ctx.fillStyle = 'blue';
            ctx.beginPath();
            ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        if (leonDeadImage.complete && leonDeadImage.naturalWidth > 0) {
            ctx.drawImage(leonDeadImage, -23, -23, 46, 46);
        } else {
            ctx.fillStyle = '#404040';
            ctx.beginPath();
            ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();

    projectiles.forEach(proj => {
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.angle);
        if (proj.source === 'grenade') {
            if (grenadeImage.complete && grenadeImage.naturalWidth > 0) {
                ctx.drawImage(grenadeImage, -3, -3, 6, 6);
            } else {
                ctx.fillStyle = '#1A1A1A';
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (proj.source === 'particle') {
            if (proj.impact) {
                ctx.fillStyle = '#A9A9A9';
                ctx.beginPath();
                ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (proj.muzzle) {
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (proj.type === 'linger') {
                ctx.fillStyle = '#FFA500';
                const scale = 1 + Math.sin(proj.lifetime * 1.5);
                ctx.beginPath();
                ctx.arc(0, 0, 1 * scale, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = proj.fast ? '#FFFF99' : 'orange';
                ctx.beginPath();
                ctx.arc(0, 0, proj.fast ? 2 : 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (proj.isRocket) {
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(-10, -2, 20, 4);
        } else if (proj.source === 'enemy' && proj.damage > 30) {
            ctx.fillStyle = '#FFFF66';
            ctx.fillRect(-7.5, -0.5, 15, 1);
        } else {
            ctx.fillStyle = '#FFFF66';
            ctx.fillRect(-25, -1.5, 50, 3);
        }
        ctx.restore();
    });

    bloodParticles.forEach(proj => {
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.angle);
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(-1, -1, 2, 2);
        ctx.restore();
    });

    if (overlayImage.complete && overlayImage.naturalWidth > 0) {
        ctx.drawImage(overlayImage, 0, 0, 1280, 1280);
    }

    window.boxes.forEach(box => {
        if (!box.collected) {
            if (box.image.complete && box.image.naturalWidth > 0) {
                ctx.drawImage(box.image, box.x - 15, box.y - 15, 30, 30);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.font = '16px "PixelOperator"';
                ctx.textAlign = 'center';
                ctx.fillText(box.label, box.x, box.y - 20);
            } else {
                console.error(`Failed to load box image: ${box.image.src}`);
                ctx.fillStyle = 'gray';
                ctx.fillRect(box.x - 15, box.y - 15, 30, 30);
            }
        }
    });

    if (gameStarted) {
        let avatar;
        if (player.hp >= 100) {
            avatar = avatarImage;
        } else if (player.hp >= 65) {
            avatar = avatar01Image;
        } else if (player.hp >= 39) {
            avatar = avatar02Image;
        } else if (player.hp > 0) {
            avatar = avatar03Image;
        } else {
            avatar = avatar2Image;
        }
        if (avatar.complete && avatar.naturalWidth > 0) {
            ctx.drawImage(avatar, canvas.width - 406, canvas.height - 336, 256, 256);
        }

        if (m4Image.complete && m4Image.naturalWidth > 0) {
            ctx.drawImage(m4Image, 1440, 70, m4Image.naturalWidth * 2.3, m4Image.naturalHeight * 2.3);
        }
        for (let i = 0; i < player.ammo; i++) {
            if (bulletImage.complete && bulletImage.naturalWidth > 0) {
                ctx.drawImage(bulletImage, 1330 + i * 14, 180, bulletImage.naturalWidth, bulletImage.naturalHeight); // Down 40px
            }
        }
        for (let i = 0; i < player.grenades; i++) {
            if (grenadeHEImage.complete && grenadeHEImage.naturalWidth > 0) {
                ctx.drawImage(grenadeHEImage, 1330 + i * 20, 260, grenadeHEImage.naturalWidth, grenadeHEImage.naturalHeight); // Down 40px
            }
        }

        // Adjusted text elements: 40px down, 10px right
        killsElement.style.top = '340px'; // Was 300px
        killsElement.style.left = '1320px'; // Was 1310px
        hpElement.style.top = '420px';    // Was 380px
        hpElement.style.left = '1320px';  // Was 1310px
        armorElement.style.top = '500px'; // Was 460px
        armorElement.style.left = '1320px'; // Was 1310px
        timeElement.style.top = '580px';  // Was 540px
        timeElement.style.left = '1320px'; // Was 1310px
        enemiesElement.style.top = '660px'; // Was 620px
        enemiesElement.style.left = '1320px'; // Was 1310px
    }

    if (player.hp <= 0) {
        const fadeFrames = 24;
        const opacity = Math.min(player.deathTimer / fadeFrames, 1) * 0.65;
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'red';
        ctx.font = 'bold 80px "PixelOperator"';
        ctx.textAlign = 'center';
        let gameOverText = 'GAME OVER';
        if (player.grenades > 0 && player.deathTimer < 210) {
            gameOverText = 'This is... from... Mathilda...';
        }
        ctx.fillText(gameOverText, canvas.width / 2, canvas.height / 2);
    }

    const hudElements = [
        window.killsElement,
        window.hpElement,
        gameStarted ? window.armorElement : null,
        window.timeElement,
        window.enemiesElement
    ].filter(Boolean);
    hudElements.forEach(element => {
        if (element) {
            element.style.fontFamily = '"PixelOperator", sans-serif';
        }
    });
}

window.render = render;
window.decals = decals;
window.tileSize = 20;