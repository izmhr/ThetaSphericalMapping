function webcaminit(video_id) {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia;
  window.URL = window.URL || window.webkitURL;

  video = document.getElementById( video_id );
  video.autoplay = true;

  var option = {
    video: { mandatory:{ minWidth: 1280 } },
    audio: true
  }

  // 1st try FullHD
  navigator.getUserMedia(option,
    function(stream) { // for success case
      video.src = window.URL.createObjectURL(stream);
    },
    function(err) { // for error case
      console.log(err);
    }
  );

  video.addEventListener('loadeddata', function() {
    // retry getting camera.
    (function getVideoResolution() {
      vidWidth = video.videoWidth;
      vidHeight = video.videoHeight;
      if(vidWidth != 0) {
        console.log("video width: " + vidWidth + " height: " + vidHeight);
      } else {
        setTimeout(getVideoResolution, 250);
      }
    })();
  });
}

var theta_view = function (video_id) {
	var scene = new THREE.Scene();
	var width  = 900;
	var height = 600;
	var fov    = 60;
	var aspect = width / height;
	var near   = 1;
	var far    = 1000;
	var camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
	camera.position.set( 0, 0, 0.1 );

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( width, height );
	var element = renderer.domElement;
	document.body.appendChild( element );

	var directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.set( 0, 0.7, 0.7 );
	scene.add( directionalLight );

  // if use realtime theta video, use this line.
  webcaminit(video_id);

	var video = document.getElementById( video_id );
	var texture = new THREE.VideoTexture( video );
	texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
	texture.format = THREE.RGBFormat;

	var geometry = new THREE.SphereGeometry(100, 32, 32, 0);
	geometry.scale(-1, 1, 1);

  var faceVertexUvs = geometry.faceVertexUvs[ 0 ];
  for ( i = 0; i < faceVertexUvs.length; i++ ) {
    var uvs = faceVertexUvs[ i ];
    var face = geometry.faces[ i ];
    for ( var j = 0; j < 3; j ++ ) {
      var x = face.vertexNormals[ j ].x;
	    var y = face.vertexNormals[ j ].y;
	    var z = face.vertexNormals[ j ].z;

      if (i < faceVertexUvs.length / 2) {
        var correction = (x == 0 && z == 0) ? 1 : (Math.acos(y) / Math.sqrt(x * x + z * z)) * (2 / Math.PI);
        // uvs[ j ].x = x * (423 / 1920) * correction + (480 / 1920);
        // uvs[ j ].y = z * (423 / 1080) * correction + (600 / 1080);
        uvs[ j ].x = x * (428 / 1920) * correction + (480 / 1920);
        uvs[ j ].y = z * (428 / 1080) * correction + (600 / 1080);

      } else {
        var correction = ( x == 0 && z == 0) ? 1 : (Math.acos(-y) / Math.sqrt(x * x + z * z)) * (2 / Math.PI);
        // uvs[ j ].x = -1 * x * (423 / 1920) * correction + (1440 / 1920);
        // uvs[ j ].y = z * (423 / 1080) * correction + (600 / 1080);
        uvs[ j ].x = -1 * x * (428 / 1920) * correction + (1440 / 1920);
        uvs[ j ].y = z * (428 / 1080) * correction + (600 / 1080);
      }
    }
  }

  geometry.rotateZ(-Math.PI / 2);
	var material = new THREE.MeshBasicMaterial( { map: texture } );
	var mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

	// PCで閲覧時にマウスドラッグで操作
	var controls = new THREE.OrbitControls(camera, element);
	// controls.rotateUp(Math.PI / 4);
	// controls.noPan = true;
  //  controls.enablePan = false;

  function keydown(e) {
    var keyCode = e.keyCode;
    switch (keyCode) {
      case 40:
        // zoom in
        camera.fov += 2;
        if(camera.fov >= 130) camera.fov = 130;
        camera.updateProjectionMatrix();
        break;
      case 38:
        // zoom out
        camera.fov -= 2;
        if(camera.fov <= 30) camera.fov = 30;
        camera.updateProjectionMatrix();
        break;
    }
  }
  document.addEventListener("keydown", keydown);


  ( function renderLoop () {
    requestAnimationFrame( renderLoop );
    renderer.render( scene, camera );
  } )();
};
