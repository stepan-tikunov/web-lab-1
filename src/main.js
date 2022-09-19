"use strict";

class Application {
	components = {
		x: document.getElementById("x"),
		y: document.getElementById("y"),
		form: document.getElementById("form"),
		submit: document.querySelector('#form [type="submit"]'),
		buttons: document.getElementsByClassName("x")
	};

	messageBoxForm = document.querySelector("#message-box form");

	animations = new AnimationProcessor();

	static errors = {
		X_IS_NAN: "x must be number xd",
		Y_IS_NAN: "y must be number xd",
		R_IS_NAN: "r must be number xd",
		TOO_LONG_X: "x too long xd",
		TOO_LONG_Y: "y too long xd",
		TOO_LONG_R: "r too long xd",
		BAD_X: "use buttons to select x, your value is bad xd",
		BAD_Y: "y must be in (-5, 5) range xd",
		BAD_R: "use radio buttons to select r, your value is bad xd",
		SERVER_UNREACHABLE: "server unreachable xd",
		SERVER_ERROR: "server error xd"
	};

	static interfaceText = {
		wait: "Wait...",
		shoot: "Shoot!"
	}

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
		const [yMin, yMax] = [-5., 5.];
		const rValues = [1., 1.5, 2., 2.5, 3.];

		let [px, py, pr] = [x, y, r].map(parseFloat);
		const someIsNan = (a, b) => isNaN(a.trim()) || isNaN(b);

		const {
			TOO_LONG_X,
			TOO_LONG_Y,
			TOO_LONG_R,
			X_IS_NAN,
			Y_IS_NAN,
			R_IS_NAN,
			BAD_X,
			BAD_Y,
			BAD_R
		} = Application.errors;

		function throwIf(error, condition) {
			if (condition)
				throw error;
		}

		throwIf(X_IS_NAN, someIsNan(x, px));
		throwIf(Y_IS_NAN, someIsNan(y, py));
		throwIf(R_IS_NAN, someIsNan(r, pr));
		throwIf(TOO_LONG_X, x.length > 15);
		throwIf(TOO_LONG_Y, y.length > 15);
		throwIf(TOO_LONG_R, r.length > 15);
		throwIf(BAD_X, !xValues.includes(px));
		throwIf(BAD_Y, yMin >= py || py >= yMax);
		throwIf(BAD_R, !rValues.includes(pr));

		return [px, py, pr];
	}

	toggleSubmit() {
		const s = this.components.submit;
		if (s.hasAttribute("disabled")) {
			s.removeAttribute("disabled");
			s.textContent = Application.interfaceText.shoot;
		} else {
			s.textContent = Application.interfaceText.wait;
			s.setAttribute("disabled", "disabled");
		}
	}

	async formSubmitHandler(e) {
		e.preventDefault();
		this.toggleSubmit();
		try {
			const [x, y, r] = this.validateAndParse(
				this.components.x.value,
				this.components.y.value,
				this.activeRadioButton().value
			);
			try {
				const response = await fetch("api/shoot.php", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({x, y, r})
				});
				const json = await response.json();
				if (response.ok) {
					const {result, now, scriptTime} = json;
					await this.animations.shoot({x, y, r, result, now, scriptTime});
				} else {
					this.animations.showMessageBox(Application.errors.SERVER_ERROR);
					console.log(json.message);
				}
			} catch (error) {
				throw Application.errors.SERVER_UNREACHABLE;
			}
		} catch (error) {
			this.animations.showMessageBox(error);
		}
		this.toggleSubmit();
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