"use strict";

class AnimationProcessor {
	x = 0;
	y = 0;
	score = 0;
	wow = false;
	hitOrMiss = document.querySelector(".hit-or-miss");
	scoreElement = document.querySelector(".score");
	messageBox = document.getElementById("message-box");
	message = document.getElementById("message");
	video = document.getElementById("video");
	wowVideo = document.getElementById("wow");
	awp = document.getElementById("awp");
	tmp = document.getElementById("tmp");
	blt = document.getElementById("blt");
	awpCtx = this.awp.getContext("2d");
	tmpCtx = this.tmp.getContext("2d");
	bltCtx = this.blt.getContext("2d");
	bulletHoles = []

	constructor() {
		document.addEventListener("click", (e) => {
			const hitmarker = document.getElementById("hitmarker");
			hitmarker.style.top = e.clientY - 12;
			hitmarker.style.left = e.clientX - 12;
			hitmarker.style.transform = `rotate(${Math.random() * 360}deg)`;
			hitmarker.classList.remove("hidden");
			setTimeout(() => hitmarker.classList.add("hidden"), 100);
		});
	}

	resizeCanvases() {
		const iw = window.innerWidth + 2 * Math.abs(this.x),
			vw = this.video.videoWidth,
			ih = window.innerHeight + Math.abs(2 * this.y),
			vh = this.video.videoHeight;
		const sx = iw / vw;
		const sy = ih / vh;
		const left = Math.min(2 * this.x, 0);
		const top = Math.min(-2 * this.y, 0);
		this.awp.style.transform = `scale(${sx}, ${sy})`;
		this.awp.style.left = `${left + (iw - vw) / 2}`;
		this.awp.style.top = `${top + (ih - vh) / 2}`;
	}

	nextFrame() {
		const video = this.wow ? this.wowVideo : this.video;
		if (video.paused || video.ended) {
			this.clearVideo();
		} else {
			this.resizeCanvases();
			this.drawVideoFrame();
		}
		window.requestAnimationFrame(this.nextFrame.bind(this));
	}

	clearVideo() {
		this.awpCtx.clearRect(0, 0, this.video.videoWidth, this.video.videoHeight);
	}

	shotResult(x, y, r, hit, now, script_time) {
		this.hitOrMiss.style.transform = `translate(${this.x}px, ${-this.y}px)`;
		let killerText = `You at ${now} for ${script_time}s`;
		let killedText = ` (${x}, ${y}, ${r})`;
		if (hit) {
			this.hitOrMiss.textContent = "+100";
			this.score += 100;
			this.scoreElement.textContent = `Score: ${this.score}`;
			killedText = "Area" + killedText;
		} else {
			this.hitOrMiss.textContent = "miss!";
			killedText = "Nothing" + killedText;
		}
		this.updateKillfeed(killerText, killedText);
		this.hitOrMiss.classList.add("fade-out");
		const removeClass = function () { this.hitOrMiss.classList.remove("fade-out") };
		setTimeout(removeClass.bind(this), 1500);
	}

	updateKillfeed(killer, killed) {
		// <div class="killfeed-element-container">
		// 	<div class="killfeed-element">
		// 		<a href="" class="killer">banned</a>
		// 		<div class="weapon awp"></div>
		// 		<a href="" class="killed">storM</a>
		// 	</div>
		// </div>
		const kfElemContainer = document.createElement("div");
		kfElemContainer.classList.add("killfeed-element-container");
		const kfElem = document.createElement("div");
		kfElem.classList.add("killfeed-element");
		const row = document.createElement("div");
		row.classList.add("row-container");
		const killerElem = document.createElement("a");
		killerElem.href = "#";
		killerElem.classList.add("killer");
		const killerElemText = document.createTextNode(killer);
		killerElem.appendChild(killerElemText);
		const weaponElem = document.createElement("div");
		weaponElem.classList.add("weapon");
		const awpElem = document.createElement("div");
		awpElem.classList.add("awp");
		weaponElem.appendChild(awpElem);
		const killedElem = document.createElement("a");
		killedElem.href = "#";
		killedElem.classList.add("killed");
		const killedElemText = document.createTextNode(killed);
		killedElem.appendChild(killedElemText);
		row.append(killerElem, weaponElem, killedElem);
		kfElem.appendChild(row);
		kfElemContainer.appendChild(kfElem);
		const killfeed = document.getElementById("killfeed");
		killfeed.insertBefore(kfElemContainer, killfeed.firstChild);
	}

	drawVideoFrame() {
		let w, h;
		if (this.wow) {
			[w, h] = [this.wowVideo.videoWidth, this.wowVideo.videoHeight];
			this.tmpCtx.drawImage(this.wowVideo, 0, 0, w, h);
		} else {
			[w, h] = [this.video.videoWidth, this.video.videoHeight];
			this.tmpCtx.drawImage(this.video, 0, 0, w, h);
		}
		const frame = this.tmpCtx.getImageData(0, 0, w, h);
		const length = frame.data.length;
		const data = frame.data;

		for (let i = 0; i < length; i += 4) {
			const red = data[i + 0];
			const green = data[i + 1];
			const blue = data[i + 2];
			if ((blue + red < green)) {
				data[i + 1] = 0;
				data[i + 3] = (255 - green);
			}
		}
		this.awpCtx.putImageData(frame, 0, 0);
	}

	async shoot(x, y, r, hit, now, script_time) {
		this.x = 80 * x / r;
		this.y = 80 * y / r;
		await this.video.play();
		window.requestAnimationFrame(this.nextFrame.bind(this));
		await new Promise(res => setTimeout(res, 900));
		this.shotResult(x, y, r, hit, now, script_time);
		await new Promise(res => setTimeout(res, 900));
		if (x == 0 && y == 0) {
			this.wow = true;
			await this.wowVideo.play();
			window.requestAnimationFrame(this.nextFrame.bind(this));
			await new Promise(res => setTimeout(res, 4000));
			this.wow = false;
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