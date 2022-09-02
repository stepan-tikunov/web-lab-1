<?php
	include "areas.php";

	$start_time = microtime(true);

	header("Content-Type: application/json; charset=utf-8");

	function abort(int $code, string $message) {
		http_response_code($code);
		echo "{\"message\":\"$message\"}";
		exit;
	}

	function json_data(array $required_parameters) {
		if ($_SERVER["CONTENT_TYPE"] !== "application/json") {
			abort(400, "Not a json");
		}
		$request_body = file_get_contents("php://input");
		$json = json_decode($request_body, true);
		if ($json === null) {
			abort(400, "Not a json");
		}

		foreach ($required_parameters as $key => $type) {
			if (!array_key_exists($key, $json)) {
				abort(400, "$key is required");
			}
			if (!$type($json[$key])) {
				abort(400, "$key must be " . str_replace("is_", "", $type));
			}
		}

		return $json;
	}

	$method = $_SERVER["REQUEST_METHOD"];
	if ($method !== "POST") {
		abort(405, "$method not allowed");
	}

	$data = json_data([
		"x" => "is_numeric",
		"y" => "is_numeric",
		"r" => "is_numeric"
	]);
	$x = $data["x"];
	$y = $data["y"];
	$r = $data["r"];
	if ($r <= 0) {
		abort(400, "r must be positive");
	}

	$area = new Union(
		new Intersection(
			new HalfPlane(1, 0, 0, HalfPlane::LEFT),
			new HalfPlane(-1, 2, -$r, HalfPlane::BOTTOM),
			new Circle(0, 0, $r)
		),
		new Rectangle(0, 0, $r, $r/2)
	);

	$hit = $area->point_within($x, $y);

	$end_time = microtime(true);
	$script_time = number_format($end_time - $start_time, 5, '.', '');
	$end_datetime = date("d/m/Y H:i:s", (int)$end_time);
?>

{
	"result": <?=$hit ? "true" : "false" ?>,
	"now": "<?=$end_datetime?>",
	"script_time": <?=$script_time?>
}