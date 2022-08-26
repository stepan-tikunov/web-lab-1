"use strict";

class Application {
	components = {
		x: document.getElementById("x"),
		buttons: document.getElementsByClassName("x"),
		y: document.getElementById("y"),
		form: document.getElementById("form"),
		submit: document.querySelector('#form [type="submit"]')
	}

	messageBoxForm = document.querySelector("#message-box form");

	animations = new AnimationProcessor();

	activeRadioButton() {
		return document.querySelector('input[type="radio"]:checked');
	}

	xButtonHandler(e) {
		const x = parseFloat(e.target.dataset.x);
		const smallButtons = document.getElementsByClassName("small");
		Array.from(smallButtons).forEach(b =>
			b.classList.remove("small")
		);
		e.target.classList.add("small");
		this.components.x.value = x;
	}

	validateAndParse(x, y, r) {
		const xValues = [-2., -1.5, -1., -.5, .0, .5, 1., 1.5, 2.];
		const yMin = -5., yMax = 5.;
		const rValues = [1., 1.5, 2., 2.5, 3.];

		let px, py, pr;

		try {
			px = parseFloat(x);
		} catch {
			this.animations.showMessageBox("x must be number xd");
			return [null,null,null];
		}

		try {
			py = parseFloat(y);
		} catch {
			this.animations.showMessageBox("y must be number xd");
			return [null,null,null];
		}

		try {
			pr = parseFloat(r);
		} catch {
			this.animations.showMessageBox("r must be number xd");
			return [null,null,null];
		}

		if (!xValues.includes(px)) {
			this.animations.showMessageBox("use buttons to select x, your value is bad xd");
			return [null,null,null];
		}
		if (yMin > py || py > yMax) {
			this.animations.showMessageBox("y must be in [-5, 5] range xd")
			return [null,null,null];
		}
		if (!rValues.includes(pr)) {
			this.animations.showMessageBox("use radio buttons to select r, your value is bad xd");
			return [null,null,null];
		}

		return [px, py, pr];
	}

	async formSubmitHandler(e) {
		e.preventDefault();
		this.components.submit.textContent = "Wait...";
		this.components.submit.setAttribute("disabled", "disabled");
		const [x, y, r] = this.validateAndParse(this.components.x.value, this.components.y.value, this.activeRadioButton().value);
		if (x !== null) {
			try {
				const response = await fetch("api/shoot.php", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({x, y, r})
				});
				const json = await response.json();
				if (response.status === 200) {
					await this.animations.shoot(x, y, r, json.result, json.now, json.script_time);
				} else {
					this.animations.showMessageBox("server error: " + json.message + " xd");
				}
			} catch (error) {
				this.animations.showMessageBox("server unreachable xd");
				console.log(error);
			}
		}
		this.components.submit.removeAttribute("disabled");
		this.components.submit.textContent = "Shoot!";
	}

	dismissMessageBox(e) {
		e.preventDefault();
		this.animations.dismissMessageBox();
	}

	constructor() {
		const selectedXButton = document.querySelector(`button[data-x="${this.components.x.value}"]`);
		if (selectedXButton) {
			selectedXButton.classList.add("small");
		} else {
			this.components.x.value = "";
		}

		Array.from(this.components.buttons).forEach(b =>
			b.addEventListener("click", this.xButtonHandler.bind(this))
		);

		this.components.form.addEventListener("submit", this.formSubmitHandler.bind(this));

		this.messageBoxForm.addEventListener("submit", this.dismissMessageBox.bind(this));
	}
}

const app = new Application();