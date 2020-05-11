var url = "https://cdn.rawgit.com/BabylonJS/Extensions/master/DynamicTerrain/dist/babylon.dynamicTerrain.min.js";
var s = document.createElement("script");
s.src = url;
document.head.appendChild(s);
var BVec3 = BABYLON.Vector3;

var autoCourse = true;

var createScene = async function(engine) {
  var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.UniversalCamera("camera1",  BVec3.Zero(), scene);

    createTerrain(scene);

  camera.position.set( 128.0, 30, 0);
  camera.rotation.set( 0, PI/4, 0);//
    camera.minZ = .1;
    camera.maxZ = 1111;
  
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogColor = new BABYLON.Color3(0.7, .7, 0.7);
  scene.fogDensity = 0.001;

  //camera.attachControl(canvas, false);
    camera.detachControl(canvas);
    var light = new BABYLON.HemisphericLight("light1", new BVec3(0.7, .2, 0), scene);
    light.specular = new BABYLON.Color3(1,1,1);
  
    var
    yyaw = 0,
    thrust = 0,
    speed = .7,
    winCntrX = engine.getRenderWidth(true)/2,
  winCntrY = engine.getRenderHeight(true)/2,
    canvas = document.getElementById("renderCanvas");

    window.addEventListener("resize", function () {
        engine.resize();
    winCntrX = engine.getRenderWidth(true)/2,
    winCntrY = engine.getRenderHeight(true)/2;
    });

    window.addEventListener("click", function () { autoCourse = !autoCourse; });

    canvas.onkeydown = function(e) {
    switch (e.which || e.keyCode ) {
    case 37: yyaw = -.004; return; // 'ArrowLeft';
    case 39: yyaw = .004; return; //'ArrowRight';
    case 38: thrust = .005; return; // 'ArrowUp';
    case 40: thrust = -.007; return; //'ArrowDown';
    }
    };

    canvas.onkeyup = function(e) {
    switch (e.which || e.keyCode ) {
    case 37: // 'ArrowLeft';
    case 39: yyaw = 0; return; //'ArrowRight';
    case 38:
    case 40: thrust = 0; return; //'ArrowDown';
    case 67: autoCourse = !autoCourse;
    }
    };

  var horizon = BABYLON.Mesh.CreateLines("lines", [
  new BVec3(-400,  0, 800),
  new BVec3(400,   0,  800),
  new BVec3(800,   0,  0),
  new BVec3(400,   0,  -800),
  new BVec3(-400,  0,  -800),
  new BVec3(-800,  0, 0),
  new BVec3(-400,  0, 800)], scene);
  horizon.enableEdgesRendering(); 
  horizon.edgesWidth = 77;
  horizon.edgesColor = new BABYLON.Color4(0, 1, 1, 1);

  var yawPitchNDKTR = BABYLON.Mesh.CreateLines("lines", [//  visual of airplane: attitude indicator
  new BVec3(-.3,  0, 3),
  new BVec3(.3,  0,  3),
  new BVec3(0,  0,  3),
  new BVec3(0,  0,  3.2),
  new BVec3(0,  0,  2.5),
  new BVec3(.1,  0,  2.5),
  new BVec3(-.1,  0,  2.5),
  new BVec3(0,  0,  2.5),
  new BVec3(0, .1, 2.5)], scene);
  yawPitchNDKTR.enableEdgesRendering(); 
  yawPitchNDKTR.edgesWidth = 1;
  yawPitchNDKTR.edgesColor = new BABYLON.Color4(0, 0, 0, 1);
    yawPitchNDKTR.setPivotMatrix(BABYLON.Matrix.Translation(0, 0, -3.1));
    yawPitchNDKTR.parent = camera;
 
  var gauges = BABYLON.Mesh.CreatePlane("outputplane", 1, scene, false);
  gauges.scaling.x = .1;
  gauges.scaling.y = .1;
  var gaugesTexture = new BABYLON.DynamicTexture("dynamic texture", 666, scene, true);
  var gaugecontext = gaugesTexture.getContext();
    gauges.material = new BABYLON.StandardMaterial("outputplane", scene);
  gauges.material.emissiveTexture = gaugesTexture;
  gauges.material.diffuseTexture = gaugesTexture;
  gauges.position.set(-.3, -.25, 1);
    gauges.parent = camera;

    ///////////////////////////////////////////////////////////////// !
    addYawPitchRollFunction(camera, 1); // see definition below.
    ///////////////////////////////////////////////////////////////// !
    var
        yawRate = .000007,
        pitchRate = .00001,
    yaw = 0,
        roll = 0,
        pitch =0,
        mx=0, my=0, 
        frontV = new BVec3(0,0,1),
        thrustDir  = new BVec3();


  engine.runRenderLoop(function () {
        mx  = scene.pointerX-winCntrX,
        my  = scene.pointerY-winCntrY;
    
    if (autoCourse) {
      my = camera.rotation.x*111;// force straight, level
      mx = camera.rotation.z*111;
    }

    yawPitchNDKTR.rotation.y = mx/4444;//  visual of airplane:
    yawPitchNDKTR.rotation.x = -my/4444;//  attitude indicator
    
        pitch = my*pitchRate;
        yaw = mx*yawRate;
        camera.autoBank(yaw, pitch, speed);
    
        //thrustDir = camera.getFrontPosition(1); // points up! ?? so use this:
        camera.getDirectionToRef(frontV, thrustDir);
        camera.position.addInPlace(thrustDir.scale(speed));// move aircraft
    
        speed += thrust;
        if (speed < 0) speed = 0;
    if (speed > 3.3) speed = 3.3;

      gaugecontext.clearRect(0, 0, 666, 666);///////////////// Dashboard
      gaugesTexture.drawText("Speed: " + (310*speed).toFixed(), null, 100, "80px verdana", "orange", null);
    gaugesTexture.drawText("Heading: " + (360*unwrapAngle(camera.rotation.y)/TWO_PI).toFixed(), null, 220, "80px verdana", "orange", null);
      gaugesTexture.drawText("Altitude: " + (10*camera.position.y).toFixed(), null, 340, "80px verdana", "orange", null);
      gaugesTexture.drawText("Lat: " + (camera.position.z).toFixed(), null, 460, "80px verdana", "orange", null);
      gaugesTexture.drawText("Lon: " + (camera.position.x).toFixed(), null, 580, "80px verdana", "orange", null);

    horizon.position = camera.position;// keep horizon in view
    
    scene.render();
  });

  // XR
  const xrHelper = await scene.createDefaultXRExperienceAsync();

  return scene;
}



function addYawPitchRollFunction(ob, gravity) {
  ob.rotationQuaternion  = new BABYLON.Quaternion();
  ob.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(ob.rotation.y, ob.rotation.x, ob.rotation.z);
  ob.myGrav = gravity;

  ob.yawPitchRoll = function(yaw, pitch, roll) {
    var axis = new BVec3(0, 0, -1);
    var partRotQuat  = new BABYLON.Quaternion();
    
        BABYLON.Quaternion.RotationAxisToRef(axis, roll, partRotQuat);
        this.rotationQuaternion.multiplyInPlace(partRotQuat);

    BABYLON.Quaternion.RotationAxisToRef(axis.set(-1, 0, 0), pitch, partRotQuat);
        this.rotationQuaternion.multiplyInPlace(partRotQuat);

    BABYLON.Quaternion.RotationAxisToRef(axis.set(0, 1, 0), yaw, partRotQuat);
        this.rotationQuaternion.multiplyInPlace(partRotQuat);

        this.rotationQuaternion.toEulerAnglesToRef(this.rotation);
  }
  
  ob.autoBank = function(yaw, pitch, speed) {
    var axis = new BVec3(0, 0, -1);
    var partRotQuat  = new BABYLON.Quaternion();
    
    var roll = Math.atan2(-yaw*222*speed, this.myGrav);
    this.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, roll);
    
        //BABYLON.Quaternion.RotationAxisToRef(axis, roll, partRotQuat);
        //this.rotationQuaternion.multiplyInPlace(partRotQuat);

    BABYLON.Quaternion.RotationAxisToRef(axis.set(-1, 0, 0), pitch, partRotQuat);
        this.rotationQuaternion.multiplyInPlace(partRotQuat);

    BABYLON.Quaternion.RotationAxisToRef(axis.set(0, 1, 0), yaw, partRotQuat);
        this.rotationQuaternion.multiplyInPlace(partRotQuat);

        this.rotationQuaternion.toEulerAnglesToRef(this.rotation);
  }
  
  ob.clearYawPitchRoll = function() {
    this.rotationQuaternion.set(0, 0, 0, 1);
    this.rotation.set(0,0,0);
  }
}



function createTerrain(sceen) {
    var mapSubX = 1024;//256;
    var mapSubZ = 1024;//256;
  var cx,cy,cz;
    var treeHeight = 11;
    var mapData = new Float32Array(mapSubX * mapSubZ * 3); // 3 float values per point : x, y and z
    var mapColors = new Float32Array(mapSubX * mapSubZ * 3); // 3 float values per point : x, y and z
  var maxHeight = 0;
    for (var l = 0; l < mapSubZ; l++) {
        for (var w = 0; w < mapSubX; w++) {
            var x = (w - mapSubX * 0.5) * 2.0;
            var z = (l - mapSubZ * 0.5) * 2.0;
            var y = (Math.abs(x*z)%97)/97; // Trees?
            y *= y * treeHeight;   // increase the computed altitude
            y += (Math.sin(x*.0245)+.5)*17+(Math.sin(z*.0245)+.5)*17; // hills

      if (y > maxHeight) maxHeight = y;
                   
            mapData[3 * (l * mapSubX + w)] = x;
            mapData[3 * (l * mapSubX + w) + 1] = y;
            mapData[3 * (l * mapSubX + w) + 2] = z;
      
      cx =Math.sin(x/101)+.5;
      cy = Math.sin((x+y+z)/47)+.5;
      //cy = Math.sin((x+11*y+z)/47)+.5;
      cz = Math.sin(z/107)+.5;

      mapColors[3 * (l * mapSubX + w)] = cx;
            mapColors[3 * (l * mapSubX + w) + 1] = cy;
            mapColors[3 * (l * mapSubX + w) + 2] = cz;
            
        }
    }

    s.onload = function() {
    var terrainSub = 256;//128;               // terrain subdivisions
    var params = {
      mapData: mapData,               // data map declaration : what data to use ?
      mapColors:mapColors,
      mapSubX: mapSubX,               // how are these data stored by rows and columns
      mapSubZ: mapSubZ,
      terrainSub: terrainSub          // how many terrain subdivisions wanted
    }
    terrain = new BABYLON.DynamicTerrain("t", params, sceen);

    terrain.LODLimits = [4, 3, 2, 2, 1, 1, 1, 1];

        terrain.updateCameraLOD = function(terrainCamera) {
            // LOD value increases with camera altitude
            var camLOD = Math.abs((terrainCamera.globalPosition.y / 30.0)|0);
            return camLOD;
        };
  }

}

var PI = Math.PI, TWO_PI = 2*PI;
function unwrapAngle(a) {
    if(a > TWO_PI) return a - TWO_PI;
    else if(a < 0) return a + TWO_PI;
    return a;
}