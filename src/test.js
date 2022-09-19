"use strict";

const func = app.validateAndParse.bind(app);
const errors = Application.errors
const { expect } = chai;
mocha.setup('bdd');
mocha.checkLeaks();

describe("Application.validateAndParse()", () => {
	const wrapper = (...args) => () => func(...args);

	const testEqual = (args, expected) =>
		() => expect(func(...args)).to.deep.equal(expected);
	const testThrow = (args, error) =>
		() => expect(wrapper(...args)).to.throw(error);
	const almostOne = "0.9999999999999999999999";

	it("should parse args if they are correct",
		testEqual(["1", "1.489", "2"], [1, 1.489, 2]));
	it("should not accept non-numeric x",
		testThrow(["x", "0", "1"], errors.X_IS_NAN));
	it("should not accept non-numeric y",
		testThrow(["0", "y", "1"], errors.Y_IS_NAN));
	it("should not accept non-numeric r",
		testThrow(["0", "0", "r"], errors.R_IS_NAN));
	it("should not accept too long values of x",
		testThrow([almostOne, "0", "1"], errors.TOO_LONG_X));
	it("should not accept too long values of y",
		testThrow(["0", almostOne, "1"], errors.TOO_LONG_Y));
	it("should not accept too long values of r",
		testThrow(["0", "0", almostOne], errors.TOO_LONG_R));
	it("should not accept x not from its range",
		testThrow(["420", "0", "1"], errors.BAD_X));
	it("should not accept y not from its range",
		testThrow(["0", "420", "1"], errors.BAD_Y));
	it("should not accept r not from its range",
		testThrow(["0", "0", "420"], errors.BAD_R));
});

(() => {
	function test() {
		// hides main page, shows mocha UI
		mocha.run();
		document.body.classList.remove("rainbow-bg-v");
		document.getElementById("container").style.display = "none";
		document.getElementById("test").classList.remove("hidden");
		[...document.styleSheets]
			.filter(ss => ![...ss.ownerNode.classList].includes("test-css"))
			.forEach(ss => ss.disabled = true);
	}

	function hide() {
		// restores main page
		document.body.classList.add("rainbow-bg-v");
		document.getElementById("container").style.display = null;
		document.getElementById("test").classList.add("hidden");
		[...document.styleSheets]
			.filter(ss => ![...ss.ownerNode.classList].includes("test-css"))
			.forEach(ss => ss.disabled = false);
	}

	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.has("test")) {
		test();
		document.querySelector("#test>button").addEventListener("click", hide);
	}
})();