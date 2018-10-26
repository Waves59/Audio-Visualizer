// variables
let canvas, ctx, source, context, analyser, fbc_array, rads,
	center_x, center_y, radius, radius_old, deltarad, shockwave,
	bars, bar_x, bar_y, bar_x_term, bar_y_term, bar_width,
	bar_height, react_x, react_y, intensity, rot, inputURL,
	JSONPThing, JSONResponse, soundCloudTrackName, audio, pause

let	artist, title, img_url, isSeeking;

let client_id = "8df0d68fcc1920c92fc389b89e7ce20f";

// give vars an initial real value to validate
bars = 200;
react_x = 0;
react_y = 0;
radius = 0;
deltarad = 0;
shockwave = 0;
rot = 0;
intensity = 0;
isSeeking = 0;

function initPage() {
	canvas = document.getElementById("visualizer_render");
	ctx = canvas.getContext("2d");
	
	document.getElementById("artwork").style.opacity = 0;
	
	audio = new Audio();
	audio.crossOrigin = "anonymous";
	audio.controls = true;
	audio.loop = false;
	audio.autoplay = false;
	
	context = new AudioContext();
	analyser = context.createAnalyser();
	// route audio playback
	source = context.createMediaElementSource(audio);
	source.connect(analyser);
	analyser.connect(context.destination);
	
	fbc_array = new Uint8Array(analyser.frequencyBinCount);
	
	frameLooper();
}

function resize_canvas() {

		canvas.width  = window.innerWidth;
		canvas.height = window.innerHeight;
}


function getJSON(url, callback) {
	JSONPThing = document.createElement("script");
	JSONPThing.type = "text/javascript";
	JSONPThing.src = url + "&callback=" + callback.name;
	document.body.appendChild(JSONPThing);
}

function userJSONCallback(data) {
	document.body.removeChild(JSONPThing); // required
	JSONPThing = null;
	
	var user_id = data.id;
	artist = data.username;
	
	var tracks = "https://api.soundcloud.com/users/" + user_id + "/tracks.json?client_id=" + client_id + "&limit=200";

	getJSON(tracks, tracksJSONCallback); // continues in tracksJSONCallback
}

function tracksJSONCallback(data) {
	document.body.removeChild(JSONPThing); // required
	JSONPThing = null;
	
	// go through each object (track) in array (data)
	for(var i = 0; i < data.length; i++) {
		var track = data[i];
		// check each track with the name (input URL)
		if(track.permalink == soundCloudTrackName) {
			inputURL = track.stream_url + "?client_id=" + client_id;
			title = track.title;
			img_url = track.artwork_url;
			
			initMp3Player();
			break;
		}
	}
}

function handleButton()
{
	var inputURL = document.getElementById("input_URL").value;
	if(inputURL.search("soundcloud.com") != -1 && inputURL.search("api.soundcloud.com") == -1) { // is it a regular old soundcloud link
		var splitBySlash = inputURL.replace(/http:\/\/|https:\/\//gi, "").split("/"); // get rid of "http://" / "https://" in front of url and then split by slashes
		if(splitBySlash.length == 3) { // make sure there's an actual song included at the end
			var soundCloudUserURL = "http://" + splitBySlash[0] + "/" + splitBySlash[1];
			soundCloudTrackName = splitBySlash[2];
			var apiResovleURL = "https://api.soundcloud.com/resolve.json?url=" + soundCloudUserURL + "&client_id=" + client_id;
			getJSON(apiResovleURL, userJSONCallback); // continues in userJSONCallback
		}
	}
}

function togglepause() {
	if(pause) {
			pause = 0;
			audio.play();
		} else {
			pause = 1;
			audio.pause();
		}
}

function autoSelect() {
	document.getElementById("input_URL").select();
}
			
function initMp3Player() {

	audio.src = inputURL;
	
	audio.play();
	
	document.getElementById("artistname").innerHTML = artist;
	document.getElementById("songname").innerHTML = title;
	document.getElementById("pagetitle").innerHTML = title;
	document.getElementById("artwork").src = img_url;
	
	document.getElementById("artwork").style.opacity = 100;
}
			
function frameLooper() {
	resize_canvas();
				
	var grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
	grd.addColorStop(0, "rgba(0, 0, 0, 1)");
	grd.addColorStop(1, "rgba(0, 0, 0, 1)");

	ctx.fillStyle = grd;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	ctx.fillStyle = "rgba(255, 255, 255, " + (intensity * 0.0000125 - 0.4) + ")";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
		
	rot += 0.0000001;
		
	react_x = 0;
	react_y = 0;
				
	intensity = 0;
				
	analyser.getByteFrequencyData(fbc_array);
	noise = new SimplexNoise();
	for (var i = 0; i < (bars); i++) {
		rads = Math.PI * 2 / bars;
						
		bar_x = center_x;
		bar_y = center_y;
				
		bar_height = Math.min(999, Math.max((fbc_array[i] * 2.5), 0));
		bar_width = 1;
						
		bar_x_term = center_x + Math.cos(rads * i + rot) * (radius + bar_height) ;
		bar_y_term = center_y + Math.sin(rads * i + rot) * (radius + bar_height) ;
						
		
					
		react_x += Math.cos(rads * i + rot) * (radius + bar_height);
		react_y += Math.sin(rads * i + rot) * (radius + bar_height);
					
		intensity += bar_height * 0.1;

		ctx.save();
					
		var lineColor = `rgb(128, ${255 / bar_x_term *0.01}, ${255 / bar_y_term *10}`
		
		ctx.strokeStyle = lineColor;
		ctx.lineWidth = bar_width;
		ctx.beginPath();
		ctx.moveTo(bar_x, bar_y);
		ctx.bezierCurveTo(bar_x, bar_y, bar_x, bar_y,bar_x_term , bar_y_term);
		ctx.lineTo(bar_x_term, bar_y_term);
		ctx.moveTo(bar_x_term, bar_y_term);
		ctx.arc(bar_x_term, bar_y_term,  10 + noise.noise2D(bar_x_term, bar_y_term) * 2, 0, Math.PI*2 , false);
		ctx.fillStyle = `rgb(128, ${255 / bar_x_term *0.01}, ${255 / bar_y_term *10}`
		ctx.fill()
		ctx.stroke();
		ctx.closePath();
		ctx.restore();
	}
				
	center_x = canvas.width / 2 - (react_x * 0.005);
	center_y = canvas.height / 2 - (react_y * 0.005);
				
	radius_old = radius;
	radius =  10 + (intensity * 0.07);
	deltarad = radius - radius_old;
				
	
	// shockwave effect			
	shockwave += 20;
				
	ctx.lineWidth = 200;
	ctx.save()
	ctx.beginPath();
	ctx.arc(center_x, center_y, shockwave + noise.noise2D(intensity , intensity ), 0, Math.PI * 2, false);
	ctx.stroke();
	ctx.restore();
	if (deltarad > 30) {
		shockwave = 0;
		
		ctx.fillStyle = `rgb(128, 128,128)`
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		rot = rot + 0.4;
	}


	ctx.fillStyle = "rgb(255, 255, 255)";
	var h = 100 * (Math.sqrt(3)/2);
	ctx.strokeStyle = "#0000";
	ctx.save();
	ctx.translate(center_x, center_y);
	ctx.beginPath();
	ctx.moveTo(0, -h / 2);
	ctx.lineTo( -100 / 2, h / 2);
	ctx.lineTo(100 / 2, h / 2);
	ctx.lineTo(0, -h / 2);
	ctx.stroke();
	ctx.fill(); 
	ctx.closePath();
	ctx.save();

	
	if (!isSeeking) {
		document.getElementById("audioTime").value = (100 / audio.duration) * audio.currentTime;
	}
	
	document.getElementById("time").innerHTML = Math.floor(audio.currentTime / 60) + ":" + (Math.floor(audio.currentTime % 60) < 10 ? "0" : "") + Math.floor(audio.currentTime % 60);

	
	window.requestAnimationFrame(frameLooper);
}
