<?php
	interface Area {
		public function point_within(float $x, float $y) : bool;
	}

	final class HalfPlane implements Area {
		private float $a;
		private float $b;
		private float $c;
		private int $direction;

		const TOP = 0;
		const BOTTOM = 1;
		const LEFT = 2;
		const RIGHT = 3;

		private function get_x(float $y): float {
			return (-$this->b * $y - $this->c) / $this->a;
		}

		private function get_y(float $x): float {
			return (-$this->a * $x - $this->c) / $this->b;
		}

		public function __construct(float $a, float $b, float $c, int $direction) {
			$this->a = $a;
			$this->b = $b;
			$this->c = $c;
			$this->direction = $direction;
		}

		public function point_within(float $x, float $y): bool {
			switch($this->direction % 4) {
				case self::TOP:
					return $this->get_y($x) <= $y;
				case self::BOTTOM:
					return $this->get_y($x) >= $y;
				case self::LEFT:
					return $this->get_x($y) >= $x;
				case self::RIGHT:
					return $this->get_x($y) <= $x;
			};
		}
	}

	class Ellipse implements Area {
		private float $x0;
		private float $y0;
		private float $a;
		private float $b;

		public function __construct(float $x0, float $y0, float $a, float $b) {
			$this->x0 = $x0;
			$this->y0 = $y0;
			$this->a = $a;
			$this->b = $b;
		}

		public function point_within(float $x, float $y): bool {
			return $this->b * $this->b * ($x - $this->x0) * ($x - $this->x0)
				+ $this->a * $this->a * ($y - $this->y0)*($y - $this->y0)
				<= $this->a * $this->a * $this->b * $this->b;
		}
	}

	class Circle extends Ellipse {
		public function __construct(float $x0, float $y0, float $r) {
			parent::__construct($x0, $y0, $r, $r);
		}
	}

	class Intersection implements Area {
		private array $areas;

		public function __construct(Area ...$areas) {
			$this->areas = $areas;
		}

		public function point_within(float $x, float $y): bool {
			$result = true;
			foreach ($this->areas as $area) {
				$result &= $area->point_within($x, $y);
			}
			return $result;
		}
	}

	class Union implements Area {
		private array $areas;

		public function __construct(Area ...$areas) {
			$this->areas = $areas;
		}

		public function point_within(float $x, float $y): bool {
			$result = false;
			foreach ($this->areas as $area) {
				$result |= $area->point_within($x, $y);
			}
			return $result;
		}
	}

	class Rectangle extends Intersection {
		public function __construct($x1, $y1, $x2, $y2) {
			$left = min($x1, $x2);
			$right = max($x1, $x2);
			$bottom = min($y1, $y2);
			$top = max($y1, $y2);
			parent::__construct(
				new HalfPlane(1, 0, -$left, HalfPlane::RIGHT),
				new HalfPlane(1, 0, -$right, HalfPlane::LEFT),
				new HalfPlane(0, 1, -$bottom, HalfPlane::TOP),
				new HalfPlane(0, 1, -$top, HalfPlane::BOTTOM)
			);
		}
	}
?>