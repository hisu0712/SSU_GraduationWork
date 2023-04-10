setupMobileDebug();

import { ARButton } from './ARButton.js';

let scene, camera, raycaster, renderer, session;
let loader, dracoLoader, reticle, objBox;
let threejsSceneImg = null;

const models = [['bus', 'phonebox'], //London
                ['eiffel', 'croissant', 'monalisa'], //Paris
                ['colosseum', 'gelato', 'pizza'], //Rome
                []] //Praque
const modelExist = {};
let menuSelected = 0; //null
let selected = null;
let cameraMode = false;
let btnClicked = null;
let dropReady = false;
let menuOpened = false;

const buttonUI1 = document.getElementById("icon-buttons");
const buttonUI2 = document.getElementById("bottomSection");
const camerabutton = document.getElementById("camera");
const touchScreen = document.getElementById("topSection");
const deleteButton = document.getElementById("delete");
const initCamera = document.getElementById("camera-init");
const photoClick = document.getElementById("photo-click");

let singleTouchDown=false, doubleTouchDown=false, pressed=false;
let touchX1, touchY1, touchX2, touchY2, deltaX1=0, deltaY1=0;
let pointer = new THREE.Vector2();
let distance, deltaDistance;
let pressedTime = 0;

init();
animate();
initRecording();

function setupMobileDebug() {
    // First thing we do is setup the mobile debug console
    // This library is very big so only use it while debugging
    // just comment it out when your app is done
    const containerEl = document.getElementById("console-ui");
    eruda.init({
      container: containerEl
    });
    const devToolEl = containerEl.shadowRoot.querySelector('.eruda-dev-tools');
    devToolEl.style.height = '40%'; // control the height of the dev tool panel
}

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 40);

    raycaster = new THREE.Raycaster();
    raycaster.far = 0;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; // we have to enable the renderer for webxr
    container.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    scene.add(hemiLight);

    const ambiLight = new THREE.AmbientLight(0x404040);
    scene.add(ambiLight);

    loader = new THREE.GLTFLoader();
    dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('../draco/');
    loader.setDRACOLoader(dracoLoader);
    
    addReticleToScene();

    renderer.domElement.style.display = "none";

    window.addEventListener('resize', onWindowResize, false);

}

function addReticleToScene(){
    const ring1 = new THREE.RingBufferGeometry(0.19, 0.2, 32, 1, 0, Math.PI/2 - 0.1).rotateX(-Math.PI/2);
    const ring2 = new THREE.RingBufferGeometry(0.19, 0.2, 32, 1, Math.PI/2, Math.PI/2 - 0.1).rotateX(-Math.PI/2);
    const ring3 = new THREE.RingBufferGeometry(0.19, 0.2, 32, 1, Math.PI, Math.PI/2 - 0.1).rotateX(-Math.PI/2);
    const ring4 = new THREE.RingBufferGeometry(0.19, 0.2, 32, 1, Math.PI*3/2, Math.PI/2 - 0.1).rotateX(-Math.PI/2);
    const circle = new THREE.CircleGeometry(0.17, 32).rotateX(-Math.PI/2);
    const material = new THREE.MeshBasicMaterial();
    const material2 = new THREE.MeshBasicMaterial();
    material2.transparent = true;
    material2.opacity = 0.3;

    reticle = new THREE.Group();
    reticle.add(new THREE.Mesh(ring1, material));
    reticle.add(new THREE.Mesh(ring2, material));
    reticle.add(new THREE.Mesh(ring3, material));
    reticle.add(new THREE.Mesh(ring4, material));
    reticle.add(new THREE.Mesh(circle, material2));

    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
}

function loadGLBFile(select, reti){
    if(select in modelExist === false){
        loader.load(
            `../image/glb/${select}.glb`,
            function (glb) {
                glb.scene.position.setFromMatrixPosition(reti.matrix);
                //glb.scene.quaternion.setFromRotationMatrix(reti.matrix);
                glb.scene.scale.set(0,0,0);
                scene.add(glb.scene);
                modelExist[select] = glb.scene;
                /*
                glb.scene.traverse((child)=>{ //material 바꾸기
                    if(!child.isMesh) return;
                    else{
                        const prevMaterial = child.material;
                        child.material = new THREE.MeshStandardMaterial();
                        THREE.MeshBasicMaterial.prototype.copy.call(child.material, prevMaterial);
                    }
                });
                */
                modelAppear(select);

                if(objBox === undefined){ //objBox 한번만 소환해놓기
                    objBox = new THREE.BoxHelper(glb.scene, 0xffff00);
                    objBox.visible = false;
                    scene.add(objBox);
                }
            },
            function (xhr) {
                //console.log((xhr.loaded / xhr.total * 100) + '% loaded' );
            },
            function (error) {
                console.error(error);
            }
        );
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

let hitTestSource = null;
let localSpace = null;
let hitTestSourceInitialized = false;

async function initializeHitTestSource(){
    session = renderer.xr.getSession();
    const viewerSpace = await session.requestReferenceSpace("viewer"); //real world place
    hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
    localSpace = await session.requestReferenceSpace("local"); // phone place
    hitTestSourceInitialized = true;

    session.addEventListener("end", () => {
        hitTestSourceInitialized = false;
        hitTestSource = null;
        for(let i=0; i<models[menuSelected].length; i++){
            document.getElementById(models[menuSelected][i]).style.display = "none";
        }
        menuSelected = null;
        
        for(let model of Object.keys(modelExist)){
            scene.remove(modelExist[model]);
            delete modelExist[model];
        }
    });
}

function render(timestamp, frame) {
    if(pressedTime !== 0 && Date.now()-pressedTime > 400){
        pressed = true;
        pressedTime = 0;
        if(modelExist[selected] !== undefined){
            deleteButton.style.width = "60px";
            buttonUI2.style.height = "0px";
            objBox.setFromObject(modelExist[selected]);
            objBox.visible = true;
        }
    }

    if(frame){
        if(!hitTestSourceInitialized){
            initializeHitTestSource();
        }
        if(hitTestSourceInitialized){
            if(cameraMode === false){
            const hitTestResults = frame.getHitTestResults(hitTestSource); //array
                if(hitTestResults.length > 0){
                    const hit = hitTestResults[0]; //closest to the camera
                    const pose = hit.getPose(localSpace); //local point
                    reticle.visible = true;
                    reticle.matrix.fromArray(pose.transform.matrix);
                    initCamera.style.display = "none";
                } else {
                    reticle.visible = false;
                    initCamera.style.display = "block";
                }
            }
        }
        renderer.render(scene, camera);
    }
}

function modelAppear(selected){
    let i=0;
    const appear = setInterval(()=>{
        modelExist[selected].scale.set(i,i,i);
        i+=0.02;

        if(i >= 0.5){
            modelExist[selected].scale.set(0.5,0.5,0.5);
            clearInterval(appear);
            return;
        }
    }, 10);
}

function modelDisappear(selected){
    let i = modelExist[selected].scale.x;
    let div = i/25;
    const disappear = setInterval(()=>{
        modelExist[selected].scale.set(i,i,i);
        i-=div;

        if(i<=0){
            scene.remove(modelExist[selected]);
            delete modelExist[selected];
            selected = null;
            clearInterval(disappear);
            return;
        }
    }, 10);
}

function modelDistance(cameraPos, modelPos){
    let distance = Math.sqrt(Math.pow(modelPos.x-cameraPos.x, 2)+Math.pow(modelPos.y-cameraPos.y, 2)+Math.pow(modelPos.z-cameraPos.z, 2));
    return 500 * (1/distance);
}

function initRecording() {
   camerabutton.addEventListener('click', () => {

        photoClick.classList.add("photo-click");
        setTimeout(()=>{
            photoClick.classList.remove("photo-click");
        }, 700);

      const session = renderer.xr.getSession && renderer.xr.getSession();
      let readbackPixels = null
      let gl = renderer.getContext()
      let readbackFramebuffer = gl.createFramebuffer()

      if (session) {
         let referenceSpace = renderer.xr.getReferenceSpace();
         session.requestAnimationFrame((time, xrFrame) => {
            let viewerPose = xrFrame.getViewerPose(referenceSpace);
            if (viewerPose) {
               for (const view of viewerPose.views) {
                  if (view.camera) {
                     let xrCamera = view.camera;
                     let binding = new XRWebGLBinding(xrFrame.session, gl);
                     let cameraTexture = binding.getCameraImage(xrCamera);

                     let videoWidth = xrCamera.width;
                     let videoHeight = xrCamera.height;

                     let bytes = videoWidth * videoHeight * 4;

                     if (bytes > 0) {
                        if (!readbackPixels || readbackPixels.length != bytes) {
                           readbackPixels = new Uint8Array(bytes);
                        }

                        readbackPixels.fill(0);

                        gl.bindTexture(gl.TEXTURE_2D, cameraTexture);
                        gl.bindFramebuffer(gl.FRAMEBUFFER, readbackFramebuffer);
                        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, cameraTexture, 0);

                        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE) {
                           gl.readPixels(0, 0, videoWidth, videoHeight, gl.RGBA, gl.UNSIGNED_BYTE, readbackPixels);

                           const canvas = document.createElement('canvas');
                           canvas.width = videoWidth
                           canvas.height = videoHeight
                           const context = canvas.getContext('2d');

                           // Flip the image
                           let halfHeight = videoHeight / 2 | 0;
                           let bytesPerRow = videoWidth * 4;

                           let temp = new Uint8Array(bytesPerRow);
                           for (let y = 0; y < halfHeight; ++y) {
                              let topOffset = y * bytesPerRow;
                              let bottomOffset = (videoHeight - y - 1) * bytesPerRow;

                              temp.set(readbackPixels.subarray(topOffset, topOffset + bytesPerRow));
                              readbackPixels.copyWithin(topOffset, bottomOffset, bottomOffset + bytesPerRow);
                              readbackPixels.set(temp, bottomOffset);
                           }

                           // Draw the pixels into the new canvas
                           const imgData = context.createImageData(videoWidth, videoHeight);
                           imgData.data.set(readbackPixels);
                           context.putImageData(imgData, 0, 0);

                           if (renderer.xr.isPresenting) {
                              renderer.xr.isPresenting = false;

                              renderer.setFramebuffer(null);
                              renderer.setRenderTarget(renderer.getRenderTarget());

                              renderer.clear();
                              renderer.render(scene, camera);
                              threejsSceneImg = renderer.domElement.toDataURL('image/png');

                              renderer.xr.isPresenting = true;
                           }

                           const img2 = new Image();
                           img2.onload = function () {
                              context.drawImage(img2, 0, 0, img2.width, img2.height, 0, 0, videoWidth, videoHeight);
                              //session.end()
                              saveFile(canvas.toDataURL('image/jpeg'), 'AR-photo-' + Date.now() + '.jpg')
                           };
                           img2.src = threejsSceneImg;
                        } else {
                           console.warn("Framebuffer incomplete!");
                        }

                        gl.bindFramebuffer(gl.FRAMEBUFFER, xrFrame.session.renderState.baseLayer.framebuffer);
                     }
                  } else {
                     console.log("Please enable WebXR Incubations in chrome://flags")
                  }
               }
            }
         });
      }
   })
}

var saveFile = function (strData, filename) {
   var link = document.createElement('a');
   if (typeof link.download === 'string') {
      document.body.appendChild(link); //Firefox requires the link to be in the body
      link.download = filename;
      link.href = strData;
      link.click();
      document.body.removeChild(link); //remove the link when done
   } else {
      location.replace(uri);
   }
}

document.getElementById("AR").addEventListener('click', (e)=>{
    const click = e.target;
    while(!click.classList.contains('arButton')){
        click = click.parentNode;
        if(click.nodeName == 'BODY'){
            click = null;
            return;
        }
    }
    menuSelected = click.dataset.value;
    ARButton.createButton(renderer,{
        requiredFeatures: ['hit-test', 'dom-overlay'],
        optionalFeatures: ['camera-access'],
        domOverlay: {root: document.body}
    }, menuSelected);

    for(let i=0; i<models[menuSelected].length; i++){
        document.getElementById(models[menuSelected][i]).style.display = "flex";
    }
});

document.getElementById("button-menu").addEventListener('click', ()=>{
    document.getElementById("mySidenav").style.width = "240px";
    menuOpened = true;
    camerabutton.style.display = "none";
});

document.getElementById("button-photo").addEventListener('click', ()=>{
    if(cameraMode === false){
        cameraMode = true;
        reticle.visible = false;
        buttonUI1.style.marginTop = "-30px";
        buttonUI2.style.height = "0px";
        camerabutton.style.bottom = "50px";
    }
});

document.getElementById("mySidenav").addEventListener('click', (e)=>{
    let click = e.target;
    while(!click.classList.contains('ar-object')){
        click = click.parentNode;
        if(click.nodeName == 'BODY'){
            click = null;
            return;
        }
    }
    if(click !== null){
        for(let i=0; i<models[menuSelected].length; i++){
            document.getElementById(models[menuSelected][i]).style.display = "none";
        }
        menuSelected = click.dataset.value;
        for(let i=0; i<models[menuSelected].length; i++){
            document.getElementById(models[menuSelected][i]).style.display = "flex";
        }
        document.getElementById("mySidenav").style.width = "0";
        menuOpened = false;
        camerabutton.style.display = "block";
    }
});

document.getElementById("main").addEventListener('touchstart', (e)=>{
    if(menuOpened){
        let click = e.target;
        if(!(click.classList.contains('sidenav') || click.classList.contains('ar-object'))){
            document.getElementById("mySidenav").style.width = "0";
            menuOpened = false;
            camerabutton.style.display = "block";
        }
    }
    else{
        btnClicked = e.target;
        while(!btnClicked.classList.contains('modelSelect')){
            btnClicked = btnClicked.parentNode;
            if(btnClicked.nodeName == 'BODY'){
                btnClicked = null;
                return;
            }
        }
        if(btnClicked !== null){
            selected = btnClicked.dataset.value;
            btnClicked.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            if(document.getElementById("touchedBtn") === null){
                const dot = document.createElement("div");
                dot.classList.add("dot");
                dot.id = "touchedBtn";
                dot.style.backgroundImage = `../image/web_xr_image/${btnClicked.dataset.value}.png")`;
                dot.style.display = "none";
                document.body.appendChild(dot);

                const arrow = document.createElement("div");
                arrow.classList.add("arrow");
                arrow.id = "arrow";
                arrow.style.backgroundImage = `url("../image/web_xr_image/arrow.png")`;
                arrow.style.display = "block";
                document.body.appendChild(arrow);
            }
        }
    }
})

document.getElementById("main").addEventListener('touchmove', (e)=>{
    if(btnClicked !== null){
        const dot = document.getElementById("touchedBtn");
        const arrow = document.getElementById("arrow");
        if(e.touches[0].pageY < window.innerHeight-150){
            dot.style.top = `${e.touches[0].pageY}px`;
            dot.style.left = `${e.touches[0].pageX}px`;
            dot.style.display = "block";
            arrow.style.display = "none";
            dropReady = true;
        }
        else{
            arrow.style.display = "block";
            dot.style.display = "none";
            dropReady = false;
        }
    }
})

document.getElementById("main").addEventListener('touchend', ()=>{
    if(btnClicked !== null){
        const dot = document.getElementById("touchedBtn");
        const arrow = document.getElementById("arrow");
        dot.remove();
        arrow.remove();
        if(dropReady === true){
            if(reticle.visible){
                loadGLBFile(selected, reticle);
            }
            dropReady = false;
        }
        btnClicked.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
        btnClicked = null;
    }
})

touchScreen.addEventListener('touchstart', e=>{
    if(e.targetTouches.length == 1){
        if(cameraMode === true){
            cameraMode = false;
            buttonUI1.style.marginTop = "20px";
            buttonUI2.style.height = "150px";
            camerabutton.style.bottom = "-70px";
        }
        else{
            singleTouchDown = true;
            touchX1 = e.touches[0].pageX;
            touchY1 = e.touches[0].pageY;
            pressedTime = Date.now();

            raycaster.far = 1000;
            pointer.x = (touchX1/window.innerWidth) * 2 - 1;
            pointer.y = -(touchY1/window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
            if(Object.keys(modelExist).length > 0){
                const intersectsArray = raycaster.intersectObjects(Object.values(modelExist));
                if(intersectsArray.length > 0){
                    selected = intersectsArray[0].object.name.split('_')[0];
                    /*
                    let originScale = modelExist[selected].scale.x;
                    let touchScale = originScale;
                    let t = -0.01;
                    
                    const modelTouch = setInterval(()=>{
                        touchScale += t;
                        modelExist[selected].scale.set(touchScale, touchScale, touchScale);
                        if(touchScale <= originScale - 0.3){
                            t = 0.01;
                        }
                        if(touchScale >= originScale){
                            modelExist[selected].scale.set(originScale, originScale, originScale);
                            clearInterval(modelTouch);
                            return;
                        }
                    }, 10);*/
                }
            }
        }
    }
    else if(e.targetTouches.length >= 2){
        singleTouchDown = false;
        doubleTouchDown = true;
        pressed = false;
        objBox.visible = false;
        deleteButton.style.width = "0px";
        buttonUI2.style.height = "150px";
        pressedTime = 0;
        raycaster.far = 0;

        touchX1 = e.touches[0].pageX;
        touchY1 = e.touches[0].pageY;
        touchX2 = e.touches[1].pageX;
        touchY2 = e.touches[1].pageY;
        distance = Math.sqrt(Math.pow(touchX2-touchX1, 2)
                    + Math.pow(touchY2-touchY1, 2));
    }
}, false);

touchScreen.addEventListener('touchend', e=>{
    if(e.targetTouches.length == 0){
        singleTouchDown = false;
        pressedTime = 0;
        raycaster.far = 0;
        if(pressed === true){
            const del = deleteButton.getBoundingClientRect();
            if(touchX1 >= del.left && touchX1 <= del.right && touchY1 >= del.top && touchY1 <= del.bottom){
                modelDisappear(selected);
            }
            pressed = false;
            if(objBox !== undefined) objBox.visible = false;
            deleteButton.style.width = "0px";
            buttonUI2.style.height = "150px";
        }
    }
    else if(e.targetTouches.length == 1){
        doubleTouchDown = false;
    }
    else if(e.targetTouches.length >= 2){
        doubleTouchDown = true;
    }
}, false);

touchScreen.addEventListener('touchmove', e=>{
    if(doubleTouchDown === true){
        touchX1 = e.touches[0].pageX;
        touchY1 = e.touches[0].pageY;
        touchX2 = e.touches[1].pageX;
        touchY2 = e.touches[1].pageY;
        deltaDistance = Math.sqrt(Math.pow(touchX2-touchX1, 2) + Math.pow(touchY2-touchY1, 2));

        if(selected in modelExist){
            let deltaScale = modelExist[selected].scale.x += (deltaDistance-distance)/100;
            if(deltaScale < 0.05){
                modelExist[selected].scale.set(0.05, 0.05, 0.05);
            }
            else{
                modelExist[selected].scale.set(deltaScale,deltaScale,deltaScale);
            }
        }

        distance = deltaDistance;
    }
    else if(pressed === true){
        deltaX1 = e.touches[0].pageX - touchX1;
        deltaY1 = e.touches[0].pageY - touchY1;
        touchX1 = e.touches[0].pageX;
        touchY1 = e.touches[0].pageY;

        if(selected in modelExist){
            const modelMove = new THREE.Vector2(deltaX1, deltaY1);
            const cameraAngle = new THREE.Vector2(camera.getWorldDirection(new THREE.Vector3).x, camera.getWorldDirection(new THREE.Vector3).z);
            cameraAngle.normalize();
            cameraAngle.rotateAround(new THREE.Vector2(), Math.PI/2);
            modelMove.rotateAround(new THREE.Vector2(), cameraAngle.angle());
            modelExist[selected].position.x += modelMove.x/modelDistance(camera.position, modelExist[selected].position);
            modelExist[selected].position.z += modelMove.y/modelDistance(camera.position, modelExist[selected].position);
            objBox.update();
        }
    }
    else if(singleTouchDown === true){
        deltaX1 = e.touches[0].pageX - touchX1;
        deltaY1 = e.touches[0].pageY - touchY1;
        touchX1 = e.touches[0].pageX;
        touchY1 = e.touches[0].pageY;
        pressedTime = 0;

        if(selected in modelExist){
            modelExist[selected].rotation.y += deltaX1/100;
        }
    }
    else{
        return;
    }
}, false);