var $ = require('jquery');
var _ = require('lodash');
var TWEEN = require('tween.js');
var React = require('react');


function sketch(p) {
	var w = 600;
	var h = w;
	var radius = w / 3.5;
	var elem_angle = p.radians(35);
	var num_elems = 14;
	var opening_angle = p.radians(70);
	var rect_w = radius / 3.4;
	var rect_h = rect_w * 1.6;
	var opacity = 200;
	// var x_rotation = 0;
	
	var prev_duration;
	var blocks = _.range(num_elems)
		.map(function(index) {
			var duration = 500;
			if (index > 0) {
				duration = 0.975 * prev_duration;
			}
			prev_duration = duration;
			var delay = 1000 + index * (duration * 0.62);
			var block = {
				index: index,
				width: rect_w,
				height: 5,
				opacity: 50,
			};
			block.tween = new TWEEN.Tween(block)
				.to({
					height: rect_h,
					opacity: opacity
				}, duration)
				.easing(TWEEN.Easing.Quadratic.In)
				.delay(delay)
				.start();
			return block;
		});

	p.setup = function() {
		p.size(w, h/*, p.OPENGL*/);
		p.rectMode(p.CENTER);
		p.frameRate(30);
	}

	p.draw = function() {
		TWEEN.update(/*time*/);
		p.background(200, 0);

		p.pushMatrix();
		p.translate(w * 0.5, h * 0.5);
		p.rotate(opening_angle * 0.5);

		var angle_step = (p.TWO_PI - opening_angle) / num_elems;

		blocks.forEach(function(block, i) {
			p.rotate(angle_step);
			p.fill(255, 212, 0, block.opacity);
			p.noStroke();
			p.pushMatrix();
				p.translate(radius, 0);
				p.rotate(elem_angle);
				p.translate(0, block.height * 0.5);
				// p.rotateX(x_rotation);
				p.rect(0, 0, block.width, block.height);
			p.popMatrix();	
		});

		p.popMatrix();
	}
}


var Logo = React.createClass({
	propTypes: {
	},

	render: function() {
		return (
			<canvas id="logo" ref="canvas"></canvas>
		);
	},

	componentDidMount: function() {
		var canvas = this.refs.canvas.getDOMNode();
		var p = new Processing(canvas, sketch);
	}
});


module.exports = Logo;
