const photos = document.querySelectorAll(".album-photo");
const album = document.querySelector(".album-3d");
const nextButton = document.getElementById("nextPhoto");
const prevButton = document.getElementById("prevPhoto");
const currentPhoto = document.getElementById("currentPhoto");
const totalPhotos = document.getElementById("totalPhotos");

let current = 0;
let startX = 0;
let dragging = false;

function updateAlbum() {
	photos.forEach((photo, index) => {
		photo.classList.remove("active", "prev", "next", "far-left", "far-right");

		let difference = index - current;

		if (difference > photos.length / 2) {
			difference -= photos.length;
		}

		if (difference < -photos.length / 2) {
			difference += photos.length;
		}

		if (difference === 0) {
			photo.classList.add("active");
		} else if (difference === -1) {
			photo.classList.add("prev");
		} else if (difference === 1) {
			photo.classList.add("next");
		} else if (difference < 0) {
			photo.classList.add("far-left");
		} else {
			photo.classList.add("far-right");
		}
	});

	currentPhoto.textContent = String(current + 1).padStart(2, "0");
}

const siteMusic = document.getElementById("gameMusic");
const musicPlaylist = [
	"amor-da-minha-vida.mp3",
	"musica-02.mp3",
	"musica-03.mp3"
];

let musicStarted = false;
let currentTrack = 0;
let musicChanging = false;

function playTrack(index) {
	currentTrack = index;
	siteMusic.src = musicPlaylist[currentTrack];
	siteMusic.load();
	siteMusic.volume = .45;
	siteMusic.play().then(() => {
		musicStarted = true;
		musicChanging = false;
	}).catch(() => {
		musicChanging = false;
	});
}

function startSiteMusic() {
	if (musicStarted) {
		return;
	}

	playTrack(currentTrack);
}

	function advanceMusic() {
	if (musicChanging) {
		return;
	}

	musicChanging = true;
	musicStarted = false;
	siteMusic.pause();
	playTrack((currentTrack + 1) % musicPlaylist.length);
}

siteMusic.addEventListener("ended", advanceMusic);
siteMusic.addEventListener("timeupdate", () => {
	if (Number.isFinite(siteMusic.duration) && siteMusic.currentTime >= siteMusic.duration - .2) {
		advanceMusic();
	}
});

siteMusic.loop = false;
startSiteMusic();
siteMusic.addEventListener("canplay", startSiteMusic);
document.addEventListener("pointerdown", startSiteMusic);
document.addEventListener("keydown", startSiteMusic);

function nextPhoto() {
	current = (current + 1) % photos.length;
	updateAlbum();
}

function previousPhoto() {
	current = (current - 1 + photos.length) % photos.length;
	updateAlbum();
}

function handleSwipe(difference) {
	if (Math.abs(difference) <= 50) {
		return;
	}

	if (difference < 0) {
		nextPhoto();
	} else {
		previousPhoto();
	}
}

totalPhotos.textContent = String(photos.length).padStart(2, "0");
nextButton.addEventListener("click", nextPhoto);
prevButton.addEventListener("click", previousPhoto);

document.addEventListener("keydown", (event) => {
	if (event.key === "ArrowRight") {
		nextPhoto();
	} else if (event.key === "ArrowLeft") {
		previousPhoto();
	}
});

album.addEventListener("mousedown", (event) => {
	dragging = true;
	startX = event.clientX;
});

document.addEventListener("mouseup", (event) => {
	if (!dragging) {
		return;
	}

	dragging = false;
	handleSwipe(event.clientX - startX);
});

album.addEventListener("touchstart", (event) => {
	startX = event.touches[0].clientX;
}, { passive: true });

album.addEventListener("touchend", (event) => {
	handleSwipe(event.changedTouches[0].clientX - startX);
}, { passive: true });

updateAlbum();

/* ===================== MINI JOGO: COLETE OS CORAÇÕES ===================== */
(function heartGame() {
	const canvas = document.getElementById("heartGame");
	if (!canvas) {
		return;
	}

	const ctx = canvas.getContext("2d");
	const scoreEl = document.getElementById("gameScore");
	const timeEl = document.getElementById("gameTime");
	const levelEl = document.getElementById("gameLevel");
	const phaseNameEl = document.getElementById("gamePhaseName");
	const phaseBanner = document.getElementById("phaseBanner");
	const phaseTransition = document.getElementById("phaseTransition");
	const phaseTransitionTitle = document.getElementById("phaseTransitionTitle");
	const phaseTransitionMessage = document.getElementById("phaseTransitionMessage");
	const nextPhaseButton = document.getElementById("nextPhaseButton");
	const livesEl = document.getElementById("gameLives");
	const lifeSegments = [...document.querySelectorAll(".life-segment")];
	const bossBar = document.getElementById("bossBar");
	const bossHealthFill = document.getElementById("bossHealthFill");
	const bossHealthText = document.getElementById("bossHealthText");
	const overlay = document.getElementById("gameOverlay");
	const messageEl = document.getElementById("gameMessage");
	const startButton = document.getElementById("gameStart");

	const WIDTH = canvas.width;
	const HEIGHT = canvas.height;
	const BASKET_Y = HEIGHT - 44;
	const BASKET_RADIUS = 26;
	const GAME_LENGTH = 60;
	const TOTAL_LEVELS = 3;
	const LEVEL_LENGTH = GAME_LENGTH / TOTAL_LEVELS;
	const STARTING_LIVES = 3;
	const BOSS_MAX_HEALTH = 20;
	const phaseNames = ["Órbita", "Chuva Estelar", "Tempestade Cósmica"];

	let basketX = WIDTH / 2;
	let targetX = basketX;
	let hearts = [];
	let enemies = [];
	let bullets = [];
	let bossBullets = [];
	let boss = null;
	let bossDefeated = false;
	let score = 0;
	let lives = STARTING_LIVES;
	let timeLeft = GAME_LENGTH;
	let running = false;
	let lastSpawn = 0;
	let lastTimestamp = 0;
	let timerId = null;
	let rafId = null;
	let particles = [];
	let enemyTimer = 0;
	let fireCooldown = 0;
	let shipPhase = 0;
	let bossShotTimer = 0;
	let currentLevel = 1;
	let bannerTimer = null;
	let phasePaused = false;
	const stars = Array.from({ length: 34 }, (_, index) => ({
		x: (index * 83) % WIDTH,
		y: 24 + ((index * 47) % 250),
		size: index % 4 === 0 ? 2 : 1,
		alpha: .25 + (index % 5) * .1,
		speed: 8 + (index % 4) * 9
	}));
	const enemySprite = new Image();
	enemySprite.src = "enemy-sprite.svg";
	const bossSprite = new Image();
	bossSprite.src = "boss-sprite.svg";
	const collectibleImages = [...document.querySelectorAll(".album-photo img")].map((photo) => {
		const image = new Image();
		image.src = photo.src;
		return image;
	});

	function drawHeart(x, y, size, color) {
		ctx.save();
		ctx.translate(x, y);
		ctx.scale(size / 20, size / 20);
		ctx.beginPath();
		ctx.moveTo(0, 6);
		ctx.bezierCurveTo(0, 2, -4, -8, -12, -8);
		ctx.bezierCurveTo(-22, -8, -22, 4, -22, 4);
		ctx.bezierCurveTo(-22, 12, -14, 20, 0, 28);
		ctx.bezierCurveTo(14, 20, 22, 12, 22, 4);
		ctx.bezierCurveTo(22, 4, 22, -8, 12, -8);
		ctx.bezierCurveTo(4, -8, 0, 2, 0, 6);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.shadowColor = color;
		ctx.shadowBlur = size > 25 ? 18 : 8;
		ctx.fill();
		ctx.restore();
	}

	function drawPhotoHeart(x, y, size, image) {
		ctx.save();
		ctx.translate(x, y);
		ctx.scale(size / 20, size / 20);
		ctx.beginPath();
		ctx.moveTo(0, 6);
		ctx.bezierCurveTo(0, 2, -4, -8, -12, -8);
		ctx.bezierCurveTo(-22, -8, -22, 4, -22, 4);
		ctx.bezierCurveTo(-22, 12, -14, 20, 0, 28);
		ctx.bezierCurveTo(14, 20, 22, 12, 22, 4);
		ctx.bezierCurveTo(22, 4, 22, -8, 12, -8);
		ctx.bezierCurveTo(4, -8, 0, 2, 0, 6);
		ctx.closePath();
		ctx.clip();
		ctx.fillStyle = "#fff8f2";
		ctx.fillRect(-22, -10, 44, 40);
		if (image.complete && image.naturalWidth > 0) {
			ctx.drawImage(image, -20, -11, 40, 39);
		}
		ctx.restore();

		ctx.save();
		ctx.translate(x, y);
		ctx.scale(size / 20, size / 20);
		ctx.beginPath();
		ctx.moveTo(0, 6);
		ctx.bezierCurveTo(0, 2, -4, -8, -12, -8);
		ctx.bezierCurveTo(-22, -8, -22, 4, -22, 4);
		ctx.bezierCurveTo(-22, 12, -14, 20, 0, 28);
		ctx.bezierCurveTo(14, 20, 22, 12, 22, 4);
		ctx.bezierCurveTo(22, 4, 22, -8, 12, -8);
		ctx.bezierCurveTo(4, -8, 0, 2, 0, 6);
		ctx.closePath();
		ctx.strokeStyle = "rgba(109, 39, 52, .8)";
		ctx.lineWidth = 1.6;
		ctx.stroke();
		ctx.restore();
	}

	function drawSparkle(x, y, size, alpha) {
		ctx.save();
		ctx.translate(x, y);
		ctx.fillStyle = `rgba(239, 207, 177, ${alpha})`;
		ctx.beginPath();
		ctx.moveTo(0, -size);
		ctx.lineTo(size * .35, -size * .35);
		ctx.lineTo(size, 0);
		ctx.lineTo(size * .35, size * .35);
		ctx.lineTo(0, size);
		ctx.lineTo(-size * .35, size * .35);
		ctx.lineTo(-size, 0);
		ctx.lineTo(-size * .35, -size * .35);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	function updateStars(dt) {
		stars.forEach((star) => {
			star.y += star.speed * dt;

			if (star.y > HEIGHT + 12) {
				star.y = -12;
				star.x = (star.x + 97) % WIDTH;
			}
		});
	}

	function drawShip(x, y, phase) {
		const enginePulse = 1 + Math.sin(phase * 12) * .18;

		ctx.save();
		ctx.translate(x, y);
		ctx.shadowColor = "#a95163";
		ctx.shadowBlur = 12;

		ctx.fillStyle = "#b65d70";
		ctx.beginPath();
		ctx.moveTo(-13, 8);
		ctx.lineTo(-27, 16);
		ctx.lineTo(-10, 18);
		ctx.closePath();
		ctx.moveTo(13, 8);
		ctx.lineTo(27, 16);
		ctx.lineTo(10, 18);
		ctx.closePath();
		ctx.fill();

		ctx.fillStyle = "#d5aa62";
		ctx.beginPath();
		ctx.moveTo(-8, 18);
		ctx.lineTo(0, 18 + 15 * enginePulse);
		ctx.lineTo(8, 18);
		ctx.closePath();
		ctx.fill();

		const bodyGradient = ctx.createLinearGradient(0, -24, 0, 18);
		bodyGradient.addColorStop(0, "#fffaf3");
		bodyGradient.addColorStop(.55, "#b9d0c5");
		bodyGradient.addColorStop(1, "#5c8582");
		ctx.fillStyle = bodyGradient;
		ctx.beginPath();
		ctx.moveTo(0, -27);
		ctx.bezierCurveTo(12, -16, 15, 1, 10, 18);
		ctx.lineTo(-10, 18);
		ctx.bezierCurveTo(-15, 1, -12, -16, 0, -27);
		ctx.closePath();
		ctx.fill();

		ctx.shadowBlur = 0;
		ctx.fillStyle = "#4d3049";
		ctx.beginPath();
		ctx.arc(0, -8, 7, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "#f7e3ba";
		ctx.beginPath();
		ctx.arc(-2, -10, 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	function drawEnemyLegacy(enemy) {
		ctx.save();
		ctx.translate(enemy.x, enemy.y);
		const bob = Math.sin(enemy.phase) * 3;
		const pulse = 1 + Math.sin(enemy.phase * 1.4) * .06;
		ctx.translate(0, bob);
		ctx.rotate(Math.sin(enemy.phase) * .08);
		ctx.scale(pulse, pulse);
		ctx.shadowColor = "#a95163";
		ctx.shadowBlur = 18;

		ctx.fillStyle = "#7e1f52";
		ctx.beginPath();
		ctx.moveTo(-enemy.size * .62, -2);
		ctx.lineTo(-enemy.size * 1.55, -enemy.size * .7);
		ctx.lineTo(-enemy.size * 1.28, enemy.size * .55);
		ctx.lineTo(-enemy.size * .72, enemy.size * .35);
		ctx.closePath();
		ctx.moveTo(enemy.size * .62, -2);
		ctx.lineTo(enemy.size * 1.55, -enemy.size * .7);
		ctx.lineTo(enemy.size * 1.28, enemy.size * .55);
		ctx.lineTo(enemy.size * .72, enemy.size * .35);
		ctx.closePath();
		ctx.fill();

		ctx.fillStyle = "#c52d5c";
		ctx.beginPath();
		ctx.moveTo(-enemy.size * .48, -enemy.size * .55);
		ctx.lineTo(-enemy.size * .9, -enemy.size * 1.4);
		ctx.lineTo(-enemy.size * .12, -enemy.size * .82);
		ctx.closePath();
		ctx.moveTo(enemy.size * .48, -enemy.size * .55);
		ctx.lineTo(enemy.size * .9, -enemy.size * 1.4);
		ctx.lineTo(enemy.size * .12, -enemy.size * .82);
		ctx.closePath();
		ctx.fill();

		ctx.fillStyle = "#35152f";
		ctx.beginPath();
		ctx.ellipse(0, 1, enemy.size * .82, enemy.size * .9, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = "#b8797e";
		ctx.stroke();
		ctx.shadowBlur = 0;
		ctx.fillStyle = "#e0b76b";
		ctx.fillRect(-enemy.size * .42, -enemy.size * .15, enemy.size * .24, 4);
		ctx.fillRect(enemy.size * .18, -enemy.size * .15, enemy.size * .24, 4);
		ctx.fillStyle = "#b65d70";
		ctx.beginPath();
		ctx.moveTo(-enemy.size * .35, enemy.size * .4);
		ctx.lineTo(-enemy.size * .12, enemy.size * .55);
		ctx.lineTo(-enemy.size * .28, enemy.size * .7);
		ctx.lineTo(0, enemy.size * .58);
		ctx.lineTo(enemy.size * .28, enemy.size * .7);
		ctx.lineTo(enemy.size * .12, enemy.size * .55);
		ctx.lineTo(enemy.size * .35, enemy.size * .4);
		ctx.stroke();
		ctx.restore();
	}

	function drawBulletLegacy(bullet) {
		if (!enemySprite.complete) {
			return;
		}

		const frame = Math.floor((enemy.phase % (Math.PI * 2)) / (Math.PI * 2) * 4);
		const spriteSize = enemy.size * 4;

		ctx.save();
		ctx.imageSmoothingEnabled = false;
		ctx.shadowColor = "#9d5867";
		ctx.shadowBlur = 9;
		ctx.drawImage(
			enemySprite,
			frame * 64,
			0,
			64,
			64,
			enemy.x - spriteSize / 2,
			enemy.y - spriteSize / 2,
			spriteSize,
			spriteSize
		);
		ctx.restore();
		ctx.fill();

		const bodyGradient = ctx.createLinearGradient(0, -24, 0, 18);
		bodyGradient.addColorStop(0, "#f8fbff");
		bodyGradient.addColorStop(.55, "#b9d0c5");
		bodyGradient.addColorStop(1, "#5c8582");
		ctx.fillStyle = bodyGradient;
		ctx.beginPath();
		ctx.moveTo(0, -27);
		ctx.bezierCurveTo(12, -16, 15, 1, 10, 18);
		ctx.lineTo(-10, 18);
		ctx.bezierCurveTo(-15, 1, -12, -16, 0, -27);
		ctx.closePath();
		ctx.fill();

		ctx.shadowBlur = 0;
		ctx.fillStyle = "#37245f";
		ctx.beginPath();
		ctx.arc(0, -8, 7, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "#f7e3ba";
		ctx.beginPath();
		ctx.arc(-2, -10, 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	function drawEnemySprite(enemy) {
		if (!enemySprite.complete) {
			return;
		}

		const frame = Math.floor((enemy.phase % (Math.PI * 2)) / (Math.PI * 2) * 4);
		const spriteSize = enemy.size * 4;

		ctx.save();
		ctx.imageSmoothingEnabled = false;
		ctx.shadowColor = "#a95163";
		ctx.shadowBlur = 9;
		ctx.drawImage(enemySprite, frame * 64, 0, 64, 64, enemy.x - spriteSize / 2, enemy.y - spriteSize / 2, spriteSize, spriteSize);
		ctx.restore();
	}

	function drawProjectile(bullet) {
		ctx.save();
		ctx.fillStyle = "#d5aa62";
		ctx.shadowColor = "#d5aa62";
		ctx.shadowBlur = 8;
		ctx.fillRect(bullet.x - 2, bullet.y - 12, 4, 18);
		ctx.restore();
	}

	function drawBoss(bossState) {
		if (!bossSprite.complete) {
			return;
		}

		const frame = Math.floor((bossState.phase % (Math.PI * 2)) / (Math.PI * 2) * 4);
		const spriteWidth = bossState.size * 5.8;
		const spriteHeight = bossState.size * 2.9;

		ctx.save();
		ctx.imageSmoothingEnabled = false;
		ctx.shadowColor = "#a2646f";
		ctx.shadowBlur = 18;
		ctx.drawImage(bossSprite, frame * 128, 0, 128, 96, bossState.x - spriteWidth / 2, bossState.y - spriteHeight / 2, spriteWidth, spriteHeight);
		ctx.restore();
	}

	function drawBossProjectile(projectile) {
		ctx.save();
		ctx.fillStyle = "#8f5363";
		ctx.shadowColor = "#8f5363";
		ctx.shadowBlur = 8;
		ctx.beginPath();
		ctx.arc(projectile.x, projectile.y, 7, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "#e0b76b";
		ctx.beginPath();
		ctx.arc(projectile.x, projectile.y, 2, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	function drawBackground(level = currentLevel) {
		const palettes = [
			["#11152e", "#2d203f", "#633b4d"],
			["#17152f", "#3d2b55", "#754963"],
			["#211329", "#52283f", "#87494e"]
		];
		const palette = palettes[level - 1];
		const phaseEffects = [
			["rgba(181, 104, 119, .22)", "rgba(213, 169, 126, .18)", "rgba(198, 154, 92, .62)"],
			["rgba(145, 108, 174, .24)", "rgba(199, 145, 158, .2)", "rgba(174, 112, 132, .66)"],
			["rgba(168, 62, 87, .28)", "rgba(183, 125, 97, .22)", "rgba(146, 82, 91, .7)"]
		];
		const effect = phaseEffects[level - 1];
		const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
		gradient.addColorStop(0, palette[0]);
		gradient.addColorStop(.5, palette[1]);
		gradient.addColorStop(1, palette[2]);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, WIDTH, HEIGHT);

		stars.forEach((star) => drawSparkle(star.x, star.y, star.size, star.alpha));

		const nebula = ctx.createRadialGradient(WIDTH * .18, HEIGHT * .25, 10, WIDTH * .18, HEIGHT * .25, 220);
		nebula.addColorStop(0, effect[0]);
		nebula.addColorStop(1, effect[0].replace(/\.\d+\)/, "0)"));
		ctx.fillStyle = nebula;
		ctx.fillRect(0, 0, WIDTH, HEIGHT);

		const blueNebula = ctx.createRadialGradient(WIDTH * .82, HEIGHT * .58, 10, WIDTH * .82, HEIGHT * .58, 220);
		blueNebula.addColorStop(0, effect[1]);
		blueNebula.addColorStop(1, effect[1].replace(/\.\d+\)/, "0)"));
		ctx.fillStyle = blueNebula;
		ctx.fillRect(0, 0, WIDTH, HEIGHT);

		const planet = ctx.createRadialGradient(WIDTH - 48, HEIGHT - 22, 4, WIDTH - 48, HEIGHT - 22, 70);
		planet.addColorStop(0, effect[2]);
		planet.addColorStop(.45, effect[2].replace(/\.\d+\)/, ".5)"));
		planet.addColorStop(1, effect[2].replace(/\.\d+\)/, "0)"));
		ctx.fillStyle = planet;
		ctx.fillRect(WIDTH - 120, HEIGHT - 95, 140, 110);

		ctx.strokeStyle = "rgba(239, 207, 177, .2)";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(26, BASKET_Y + 24);
		ctx.lineTo(WIDTH - 26, BASKET_Y + 24);
		ctx.stroke();
	}

	function addCollectionBurst(x, y, color) {
		for (let index = 0; index < 10; index += 1) {
			const angle = (Math.PI * 2 * index) / 10;
			const speed = 35 + Math.random() * 45;
			particles.push({
				x,
				y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: .55,
				maxLife: .55,
				color
			});
		}
	}

	function updateParticles(dt) {
		particles = particles.filter((particle) => {
			particle.x += particle.vx * dt;
			particle.y += particle.vy * dt;
			particle.vy += 35 * dt;
			particle.life -= dt;
			return particle.life > 0;
		});
	}

	function drawParticles() {
		particles.forEach((particle) => {
			ctx.save();
			ctx.globalAlpha = particle.life / particle.maxLife;
			ctx.fillStyle = particle.color;
			ctx.beginPath();
			ctx.arc(particle.x, particle.y, 2.5, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		});
	}

	function clampX(x) {
		return Math.min(WIDTH - BASKET_RADIUS, Math.max(BASKET_RADIUS, x));
	}

	function updateLives() {
		lifeSegments.forEach((segment, index) => {
			segment.classList.toggle("active", index < lives);
			segment.classList.toggle("lost", index >= lives);
		});
		livesEl.setAttribute("aria-label", `${lives} vidas restantes`);
		livesEl.classList.remove("damage");
		void livesEl.offsetWidth;
		livesEl.classList.add("damage");
	}

	function fire() {
		if (!running || fireCooldown > 0) {
			return;
		}

		bullets.push({ x: basketX, y: BASKET_Y - 24, speed: 430 });
		fireCooldown = .24;
	}

	function pointerX(clientX) {
		const rect = canvas.getBoundingClientRect();
		const scale = WIDTH / rect.width;
		return (clientX - rect.left) * scale;
	}

	function spawnHeart(elapsed) {
		const level = getLevel(elapsed);
		const fakeChance = .16 + (level - 1) * .1;
		const isFake = Math.random() < fakeChance;
		hearts.push({
			x: 30 + Math.random() * (WIDTH - 60),
			y: -20,
			r: 14 + Math.random() * 8,
			speed: 90 + Math.random() * 60 + (level - 1) * 65,
			isFake,
			image: isFake ? null : collectibleImages[Math.floor(Math.random() * collectibleImages.length)],
			color: isFake ? "#9b596b" : (Math.random() > 0.3 ? "#6d2734" : "#b3894f")
		});
	}

	function spawnEnemy(elapsed) {
		const level = getLevel(elapsed);
		enemies.push({
			x: 35 + Math.random() * (WIDTH - 70),
			y: -25,
			size: 16 + Math.random() * 5,
			speed: 38 + level * 18 + Math.random() * 28,
			velocityX: (Math.random() - .5) * (35 + level * 15),
			phase: Math.random() * Math.PI * 2
		});
	}

	function spawnBoss() {
		boss = {
			x: WIDTH / 2,
			y: 170,
			size: 34,
			health: BOSS_MAX_HEALTH,
			phase: 0,
			velocityX: 110
		};
		bossBullets = [];
		bossShotTimer = .8;
		bossDefeated = false;
		bossHealthFill.style.width = "100%";
		bossHealthText.textContent = String(BOSS_MAX_HEALTH);
		bossBar.classList.add("visible");
	}

	function updateBoss(dt) {
		if (!boss) {
			return;
		}

		boss.phase += dt;
		boss.x += boss.velocityX * dt;
		if (boss.x < boss.size * 2 || boss.x > WIDTH - boss.size * 2) {
			boss.velocityX *= -1;
		}

		bossShotTimer -= dt;
		if (bossShotTimer <= 0) {
			const spread = boss.health <= BOSS_MAX_HEALTH / 2 ? [-55, 0, 55] : [0];
			spread.forEach((velocityX) => {
				bossBullets.push({ x: boss.x, y: boss.y + boss.size, velocityX, speed: 190 });
			});
			bossShotTimer = boss.health <= BOSS_MAX_HEALTH / 2 ? .72 : 1.05;
		}

		bossBullets = bossBullets.filter((projectile) => {
			projectile.x += projectile.velocityX * dt;
			projectile.y += projectile.speed * dt;
			const hitPlayer = projectile.y > BASKET_Y - 24 && Math.abs(projectile.x - basketX) < BASKET_RADIUS + 8;

			if (hitPlayer) {
				lives = Math.max(0, lives - 1);
				updateLives();
				return false;
			}

			return projectile.y < HEIGHT + 20;
		});

		const hit = bullets.find((bullet) => Math.abs(bullet.x - boss.x) < boss.size * 1.5 && Math.abs(bullet.y - boss.y) < boss.size * 1.5);
		if (hit) {
			bullets = bullets.filter((bullet) => bullet !== hit);
			boss.health -= 1;
			bossHealthFill.style.width = `${(boss.health / BOSS_MAX_HEALTH) * 100}%`;
			bossHealthText.textContent = String(Math.max(0, boss.health));
			addCollectionBurst(boss.x, boss.y, "#c69a5c");

			if (boss.health <= 0) {
				boss = null;
				bossDefeated = true;
				bossBullets = [];
				bossBar.classList.remove("visible");
				endGame(true);
			}
		}
	}

	function getLevel(elapsed) {
		return Math.min(TOTAL_LEVELS, Math.floor(elapsed / LEVEL_LENGTH) + 1);
	}

	function updatePhase(elapsed) {
		const nextLevel = getLevel(elapsed);

		if (nextLevel <= currentLevel || phasePaused) {
			return;
		}

		currentLevel = nextLevel;
		levelEl.textContent = String(currentLevel);
		phaseNameEl.textContent = phaseNames[currentLevel - 1];
		phaseTransitionTitle.textContent = `Fase ${currentLevel}`;
		phaseTransitionMessage.textContent = `${phaseNames[currentLevel - 1]} · o espaço ficou mais perigoso.`;
		nextPhaseButton.textContent = `Ir para a fase ${currentLevel}`;
		phasePaused = true;
		running = false;
		clearInterval(timerId);
		cancelAnimationFrame(rafId);
		draw();
		phaseTransition.classList.add("visible");
	}

	function update(dt, elapsed) {
		basketX += (targetX - basketX) * 0.18;
		updateParticles(dt);
		updateStars(dt);
		fireCooldown = Math.max(0, fireCooldown - dt);
		shipPhase += dt;

		const level = getLevel(elapsed);
		const spawnInterval = Math.max(.62, 1.15 - level * .12 - elapsed * .002);

		if (level === TOTAL_LEVELS && !boss && !bossDefeated) {
			spawnBoss();
		}

		if (elapsed - lastSpawn > spawnInterval) {
			spawnHeart(elapsed);
			lastSpawn = elapsed;
		}

		enemyTimer -= dt;
		const maxEnemies = boss ? 0 : level;
		if (enemyTimer <= 0 && enemies.length < maxEnemies) {
			spawnEnemy(elapsed);
			enemyTimer = Math.max(1.6, 2.5 - level * .2);
		}

		bullets = bullets.filter((bullet) => {
			bullet.y -= bullet.speed * dt;
			return bullet.y > -20;
		});
		updateBoss(dt);
		if (!running) {
			return;
		}

		enemies = enemies.filter((enemy) => {
			enemy.y += enemy.speed * dt;
			enemy.x += enemy.velocityX * dt;
			enemy.phase += dt * 3;

			if (enemy.x < enemy.size || enemy.x > WIDTH - enemy.size) {
				enemy.velocityX *= -1;
			}

			const hit = bullets.some((bullet) => Math.abs(bullet.x - enemy.x) < enemy.size && Math.abs(bullet.y - enemy.y) < enemy.size);
			if (hit) {
				bullets = bullets.filter((bullet) => !(Math.abs(bullet.x - enemy.x) < enemy.size && Math.abs(bullet.y - enemy.y) < enemy.size));
				score += 3;
				scoreEl.textContent = String(score);
				addCollectionBurst(enemy.x, enemy.y, "#d8bd93");
				return false;
			}

			if (enemy.y > BASKET_Y - 8) {
				lives = Math.max(0, lives - 1);
				updateLives();
				return false;
			}

			return true;
		});

		if (lives <= 0) {
			endGame();
			return;
		}

		hearts = hearts.filter((heart) => {
			heart.y += heart.speed * dt;

			const dx = heart.x - basketX;
			const dy = heart.y - BASKET_Y;
			const caught = heart.y > BASKET_Y - 30 && Math.abs(dx) < BASKET_RADIUS + heart.r * 0.5 && Math.abs(dy) < 34;

			if (caught) {
				score = heart.isFake ? Math.max(0, score - 2) : score + 1;
				scoreEl.textContent = String(score);
				addCollectionBurst(heart.x, heart.y, heart.color);
				return false;
			}

			return heart.y < HEIGHT + 30;
		});
	}

	function draw() {
		drawBackground();
		hearts.forEach((heart) => {
			if (heart.isFake) {
				drawHeart(heart.x, heart.y, heart.r, heart.color);
			} else {
				drawPhotoHeart(heart.x, heart.y, heart.r, heart.image);
			}
		});
		enemies.forEach(drawEnemySprite);
		bullets.forEach(drawProjectile);
		if (boss) {
			drawBoss(boss);
			bossBullets.forEach(drawBossProjectile);
		}
		drawParticles();
		drawShip(basketX, BASKET_Y, shipPhase);
	}

	function loop(timestamp) {
		if (!running) {
			return;
		}

		if (!lastTimestamp) {
			lastTimestamp = timestamp;
		}

		const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
		lastTimestamp = timestamp;
		const elapsed = GAME_LENGTH - timeLeft;
		updatePhase(elapsed);
		if (!running) {
			return;
		}
		levelEl.textContent = String(currentLevel);

		update(dt, elapsed);
		draw();

		rafId = requestAnimationFrame(loop);
	}

	function finalMessage(victory = false) {
		if (victory) {
			return `Chefe derrotado! Você salvou o nosso universo e terminou com ${score} pontos.`;
		}

		if (lives <= 0) {
			return `Os inimigos chegaram até você. Você capturou ${score} corações antes de perder suas 3 vidas.`;
		}

		if (score >= 25) {
			return `${score} corações! Assim como esses, eu recolhi cada pedacinho do seu ao longo desses 4 anos. Eu te amo.`;
		}

		if (score >= 12) {
			return `${score} corações capturados. Cada um deles é um "eu te amo" a mais na nossa história.`;
		}

		return `Você capturou ${score} corações — mas o mais importante, o meu, você já tinha capturado há 4 anos. ♥`;
	}

	function endGame(victory = false) {
		running = false;
		clearInterval(timerId);
		cancelAnimationFrame(rafId);
		messageEl.textContent = finalMessage(victory);
		startButton.textContent = "Jogar novamente";
		overlay.classList.remove("hidden");
	}

	function startRoundClock() {
		clearInterval(timerId);
		timerId = setInterval(() => {
			timeLeft -= 1;
			timeEl.textContent = String(Math.max(0, timeLeft));

			if (timeLeft <= 0) {
				endGame();
			}
		}, 1000);
	}

	function continueToNextPhase() {
		phasePaused = false;
		phaseTransition.classList.remove("visible");
		running = true;
		startRoundClock();
		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(loop);
	}

	function startGame() {
		score = 0;
		timeLeft = GAME_LENGTH;
		hearts = [];
		enemies = [];
		bullets = [];
		bossBullets = [];
		boss = null;
		bossDefeated = false;
		particles = [];
		lives = STARTING_LIVES;
		basketX = WIDTH / 2;
		targetX = basketX;
		lastSpawn = 0;
		lastTimestamp = 0;
		enemyTimer = .4;
		fireCooldown = 0;
		shipPhase = 0;
		scoreEl.textContent = "0";
		timeEl.textContent = String(GAME_LENGTH);
		levelEl.textContent = "1";
		phaseNameEl.textContent = phaseNames[0];
		phaseBanner.classList.remove("visible");
		phaseTransition.classList.remove("visible");
		bossBar.classList.remove("visible");
		currentLevel = 1;
		phasePaused = false;
		updateLives();
		overlay.classList.add("hidden");
		running = true;

		startRoundClock();
		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(loop);
	}

	startButton.addEventListener("click", startGame);
	nextPhaseButton.addEventListener("click", continueToNextPhase);

	canvas.addEventListener("mousemove", (event) => {
		targetX = clampX(pointerX(event.clientX));
	});

	canvas.addEventListener("click", fire);

	canvas.addEventListener("touchmove", (event) => {
		targetX = clampX(pointerX(event.touches[0].clientX));
	}, { passive: true });

	document.addEventListener("keydown", (event) => {
		if (!running) {
			return;
		}

		if (event.key === "ArrowLeft") {
			targetX = clampX(targetX - 28);
		} else if (event.key === "ArrowRight") {
			targetX = clampX(targetX + 28);
		} else if (event.code === "Space") {
			event.preventDefault();
			fire();
		}
	});

	updateLives();
	draw();
})();