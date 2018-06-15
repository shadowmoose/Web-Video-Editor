let video = document.querySelector(".video");
const canvas = document.getElementById("canv");
const ctx = canvas.getContext("2d");
let slider = document.getElementById('slider');

let video_size = {'w': 0, 'h': 0};
let loaded = false;
let time_start = 10;
let time_end = 12;


$(function() {
	console.log('Loaded DOM.');

	$("#video_selector").change(function (e) {
		let fileInput = e.target;
		let fileUrl = window.URL.createObjectURL(fileInput.files[0]);
		$(".video").attr("src", fileUrl);
		e.target.remove();
	});

	$(".video").bind("loadedmetadata", function (e) {
		video_size = {'w': this.videoWidth, 'h': this.videoHeight};
		loaded = true;
		$('.hide_until_load').removeClass('hidden');
		noUiSlider.create(slider, {
			start: [0, this.duration],
			connect: true,
			range: {
				'min': 0,
				'max': this.duration
			}
		});
		slider.noUiSlider.on('update', (range)=>{
			update_slider_fields(range);
		});
		update_slider_fields();
	}).bind('loadeddata', function(e) {
		e.target.play();  // start playing
		update(e.target); //Start rendering
	}).on('pause', (e)=>{
		console.log('Paused: ', e.target.currentTime)
	});

	$('.slider_control').on('change', (e)=>{
		set_slider();
	});
});


function update_slider_fields(range){
	if(!range || range.length < 2)
		return;
	document.querySelectorAll('.slider_control').forEach(function(input) {
		input.value = range[input.dataset.pos];
	});
	time_start = range[0];
	time_end = range[1];
}

function set_slider(){
	let vals = [];
	document.querySelectorAll('.slider_control').forEach(function(input) {
		vals.push(input.value)
	});
	console.log(vals);
	slider.noUiSlider.set(vals);
}


function update(){
	canvas.width = video.width;
	canvas.height = video.height;
	ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height);
	if(video.currentTime < time_start)
		video.currentTime = time_start;
	if(video.currentTime > time_end)
		video.currentTime = time_start;
	let complete_percent = 100*(video.currentTime/video.duration);
	$(".slider_time_pos").css("left", complete_percent+"%");
	$(".current_time").text(video.currentTime.toFixed(2));
	// noinspection JSCheckFunctionSignatures
	ctx.drawImage(video, 0,0, canvas.width, canvas.height); //TODO: Subimage using crop.
	requestAnimationFrame(update.bind(this)); // Tell browser to trigger this method again, next animation frame.
}
