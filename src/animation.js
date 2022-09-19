"use strict";

class AnimationProcessor {
	xOffset = 0;
	yOffset = 0;
	score = 0;
	wow = false;
	killfeed = [];
	hitOrMiss = document.querySelector("#hit-or-miss");
	scoreElement = document.querySelector("#score");
	messageBox = document.getElementById("message-box");
	message = document.getElementById("message");
	awpVideo = document.getElementById("video");
	wowVideo = document.getElementById("wow");
	awp = document.getElementById("awp");
	tmpCanvas = document.getElementById("tmp");
	blt = document.getElementById("blt");
	awpCtx = this.awp.getContext("2d");
	tmpCtx = this.tmpCanvas.getContext("2d");
	bltCtx = this.blt.getContext("2d");
	hitmarker = document.getElementById("hitmarker");

	constructor() {
		document.addEventListener("click", (e) => {
			this.showHitmarker(e.clientX, e.clientY);
		});

		this.killfeed = JSON.parse(window.sessionStorage.getItem("killfeed")) ?? [];
		for (const data of this.killfeed) {
			this.updateKillfeed(data);
		}
	}

	showHitmarker(clientX, clientY) {
		const centerOffset = 12;
		const rotateDeg = Math.random() * 360;
		this.hitmarker.style.left = clientX - centerOffset;
		this.hitmarker.style.top = clientY - centerOffset;
		this.hitmarker.style.transform = `rotate(${rotateDeg}deg)`;
		this.hitmarker.classList.remove("hidden");
		setTimeout(() => this.hitmarker.classList.add("hidden"), 100);
	}

	resizeCanvasesToAim() {
		const canvasWidth = window.innerWidth + 2 * Math.abs(this.xOffset),
			videoWidth = this.awpVideo.videoWidth,
			canvasHeight = window.innerHeight + Math.abs(2 * this.yOffset),
			videoHeight = this.awpVideo.videoHeight;
		const widthScale = canvasWidth / videoWidth;
		const heightScale = canvasHeight / videoHeight;
		const left = Math.min(2 * this.xOffset, 0);
		const top = Math.min(-2 * this.yOffset, 0);
		this.awp.style.transform = `scale(${widthScale}, ${heightScale})`;
		this.awp.style.left = `${left + (canvasWidth - videoWidth) / 2}`;
		this.awp.style.top = `${top + (canvasHeight - videoHeight) / 2}`;
	}

	nextFrame() {
		const video = this.wow ? this.wowVideo : this.awpVideo;
		if (video.paused || video.ended) {
			this.clearVideo();
		} else {
			this.resizeCanvasesToAim();
			this.drawVideoFrame();
		}
		window.requestAnimationFrame(this.nextFrame.bind(this));
	}

	clearVideo() {
		this.awpCtx.clearRect(0, 0, this.awpVideo.videoWidth, this.awpVideo.videoHeight);
	}

	hit() {
		this.hitOrMiss.textContent = "+420";
		this.score += 420;
		this.scoreElement.textContent = `Score: ${this.score}`;
		this.hitOrMiss.classList.add("fade-out");
		const removeClass = function () { this.hitOrMiss.classList.remove("fade-out") };
		setTimeout(removeClass.bind(this), 1500);
	}

	miss() {
		this.hitOrMiss.textContent = "miss!";
		this.hitOrMiss.classList.add("fade-out");
		const removeClass = function () { this.hitOrMiss.classList.remove("fade-out") };
		setTimeout(removeClass.bind(this), 1500);
	}

	saveKillfeed() {
		window.sessionStorage.setItem("killfeed", JSON.stringify(this.killfeed));
	}

	shotResult(data) {
		this.hitOrMiss.style.transform = `translate(${this.xOffset}px, ${-this.yOffset}px)`;
		data.result ? this.hit() : this.miss();
		this.updateKillfeed(data);
		this.killfeed.push(data);
		this.saveKillfeed();
	}

	createElements(e){
		function* generator(e) {
			for (const key in e) {
				const [tagName, ...classes] = key.split(".");
				const newElement = document.createElement(tagName);
				newElement.classList.add(...classes);
				if (typeof e[key] === "string") {
					newElement.textContent = e[key];
					yield newElement;
				} else if (typeof e[key] === "object") {
					const children = generator(e[key]);
					newElement.replaceChildren(...children);
					yield newElement;
				}
			}
		}

		return [...generator(e)];
	}

	updateKillfeed(data) {
		const {x, y, r, result, now, scriptTime} = data;
		const killerText  = `You at ${now} for ${scriptTime}s`;
		const killedText = (result ? "Area" : "Notning") + ` (${x}, ${y}, ${r})`;
		const killfeedElementDescription = {
			"div.killfeed-element-container" : {
				"div.killfeed-element" : {
					"div.row-container" : {
						"a.killer" : killerText,
						"div.weapon": {"div.awp": ""},
						"a.killed": killedText
					}
				}
			}
		};

		const killfeedElement = this.createElements(killfeedElementDescription)[0];
		const killfeed = document.getElementById("killfeed");

		killfeed.insertBefore(killfeedElement, killfeed.firstChild);
	}

	drawVideoFrame() {
		const video = this.wow ? this.wowVideo : this.awpVideo;
		const {videoWidth, videoHeight} = video;
		this.tmpCtx.drawImage(video, 0, 0, videoWidth, videoHeight);
		const frame = this.tmpCtx.getImageData(0, 0, videoWidth, videoHeight);
		const length = frame.data.length;
		const data = frame.data;

		for (let i = 0; i < length; i += 4) {
			const [r, g, b, a] = [i, i + 1, i + 2, i + 3];
			if ((data[b] + data[r] < data[g])) {
				data[a] = (255 - data[g]);
				data[g] = 0;
			}
		}
		this.awpCtx.putImageData(frame, 0, 0);
	}

	sleep(ms) {
		return new Promise(res => setTimeout(res, ms));
	}

	async playAwpVideo() {
		await this.awpVideo.play();
		this.nextFrame()
		await this.sleep(900);
	}

	async playWowVideo() {
		this.wow = true;
		await this.wowVideo.play();
		this.nextFrame();
		await this.sleep(4000);
		this.wow = false;
	}

	async shoot(data) {
		const {x, y, r} = data;
		const rSizeInPixels = 80;
		this.xOffset = rSizeInPixels * x / r;
		this.yOffset = rSizeInPixels * y / r;
		this.playAwpVideo();
		await this.sleep(900);
		this.shotResult(data);
		if (x == 0 && y == 0) {
			this.playWowVideo()
		}
	}

	showMessageBox(message) {
		this.message.textContent = message;
		this.messageBox.classList.remove("hidden");
	}

	dismissMessageBox() {
		this.messageBox.classList.add("hidden");
	}
}