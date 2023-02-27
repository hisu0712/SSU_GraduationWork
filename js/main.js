(()=>{ //전역변수 사용 안하기 위해(자동 호출 함수)

  let yOffset = 0; ///window.pageYOffset 대신 쓸 변수
  let prevScrollHeight = 0; ///현재 스크롤 위치(yOffset)보다 이전에 위치한 스크롤 섹션들의 스크롤 높이값의 합
  let currentScene = 0; ///현재 활성화된(눈앞에 보고있는) 씬(scroll-section)
  let enterNewScene = false; ///새로 scene이 시작된 순간 true
  //부드러운 감속
  let acc = 0.1; //가속도
  let delayedYOffset = 0;
  let rafId;
  let rafState;

  const sceneInfo = [
    {
      //0
      type: 'sticky',
      heightNum: 5, ///브라우저 높이의 5배로 scrollHeight 세팅(반응형)
      scrollHeight: 0, //각 구간의 스크롤 높이 정보
      objs: {
        container: document.querySelector('#scroll-section-0'), //html 각 세션
        messageA: document.querySelector('#scroll-section-0 .main-message.a'),
        messageB: document.querySelector('#scroll-section-0 .main-message.b'),
        messageC: document.querySelector('#scroll-section-0 .main-message.c'),
        messageD: document.querySelector('#scroll-section-0 .main-message.d'),
        canvas: document.querySelector('#video-canvas-0'),
        context: document.querySelector('#video-canvas-0').getContext('2d'),
        videoImages: []
      }, //어느시점에 이 메시지들 등장시킬지
      values: {
        videoImagesCount: 241,
        imageSequence: [0, 240],
        canvas_opacity: [1, 0, { start:0.9, end: 1 }],

        messageA_opacity_in: [0, 1, { start: 0.1, end: 0.2 }],
        messageB_opacity_in: [0, 1, { start: 0.3, end: 0.4 }],
        messageC_opacity_in: [0, 1, { start: 0.5, end: 0.6 }],
        messageD_opacity_in: [0, 1, { start: 0.7, end: 0.8 }],

        messageA_translateY_in: [20, 0, { start: 0.1, end: 0.2 }], //20% 밑에서 제자리로 올라옴
        messageB_translateY_in: [20, 0, { start: 0.3, end: 0.4 }],
        messageC_translateY_in: [20, 0, { start: 0.5, end: 0.6 }],
        messageD_translateY_in: [20, 0, { start: 0.7, end: 0.8 }],

        messageA_opacity_out: [1, 0, { start: 0.25, end: 0.3 }],
        messageB_opacity_out: [1, 0, { start: 0.45, end: 0.5 }],
        messageC_opacity_out: [1, 0, { start: 0.65, end: 0.7 }],
        messageD_opacity_out: [1, 0, { start: 0.85, end: 0.9 }],

        messageA_translateY_out: [0, -20, { start: 0.25, end: 0.3 }],
        messageB_translateY_out: [0, -20, { start: 0.45, end: 0.5 }],
        messageC_translateY_out: [0, -20, { start: 0.65, end: 0.7 }],
        messageD_translateY_out: [0, -20, { start: 0.85, end: 0.9 }],
      }
    },
    {
      //1
      type: 'normal',
      /// heightNum: 5, type normal에서는 필요 없음
      scrollHeight: 0,
      objs: {
        container: document.querySelector('#scroll-section-1'),
        content: document.querySelector('#scroll-section-1 .description')
      }
    },
    {
      //2
      type: 'sticky',
      heightNum: 5,
      scrollHeight: 0, 
      objs: {
        container: document.querySelector('#scroll-section-2'),
        messageA: document.querySelector('#scroll-section-2 .a'),
        messageB: document.querySelector('#scroll-section-2 .b'),
        messageC: document.querySelector('#scroll-section-2 .c'),
        pinB: document.querySelector('#scroll-section-2 .b .pin'),
        pinC: document.querySelector('#scroll-section-2 .c .pin'),
        canvas: document.querySelector('#video-canvas-1'),
        context: document.querySelector('#video-canvas-1').getContext('2d'),
        videoImages: []
      },
      values: {
        videoImagesCount: 960,
        imageSequence: [0, 959],
        canvas_opacity_in: [0, 1, { start:0, end: 0.1 }],
        canvas_opacity_out: [1, 0, { start:0.95, end: 1 }],

        messageA_translateY_in: [20, 0, { start:0.15, end: 0.2 }],
        messageB_translateY_in: [30, 0, { start:0.6, end: 0.65 }],
        messageC_translateY_in: [30, 0, { start:0.87, end: 0.92 }],
        
        messageA_opacity_in: [0, 1, { start: 0.25, end: 0.3 }],
        messageB_opacity_in: [0, 1, { start: 0.6, end: 0.65 }],
        messageC_opacity_in: [0, 1, { start:0.87, end: 0.92 }],

        messageA_translateY_out: [0, -20, { start: 0.4, end: 0.45 }],
        messageB_translateY_out: [0, -20, { start: 0.68, end: 0.73 }],
        messageC_translateY_out: [0, -20, { start: 0.95, end: 1 }],

        messageA_opacity_out: [1, 0, { start: 0.4, end: 0.45 }],
        messageB_opacity_out: [1, 0, { start: 0.68, end: 0.73 }],
        messageC_opacity_out: [1, 0, { start:0.95, end: 1 }],

        pinB_scaleY: [0.5, 1, { start: 0.6, end: 0.65}],
        pinC_scaleY: [0.5, 1, { start: 0.87, end: 0.92}],
        pinB_opacity_in: [0, 1, { start: 0.6, end: 0.65 }],
        pinC_opacity_in: [0, 1, { start: 0.87, end: 0.92 }],
        pinB_translateY_out: [1, 0, { start: 0.68, end: 0.73}],
        pinC_translateY_out: [1, 0, { start: 0.95, end: 1}]
      }
    },
    {
      //3
      type: 'sticky',
      heightNum: 5,
      scrollHeight: 0,
      objs: {
        container: document.querySelector('#scroll-section-3'),
        canvasCaption: document.querySelector('.canvas-caption'),
        canvas: document.querySelector('.image-blend-canvas'),
        context: document.querySelector('.image-blend-canvas').getContext('2d'),
        ImagesPath: [
          './image/blend-image-1.jpg',
          './image/blend-image-2.jpg'
        ],
        images: []
      }, 
      values: {
        rect1X: [ 0, 0, { start: 0, end: 0 }],
        rect2X: [ 0, 0, { start: 0, end: 0 }],
        blendHeiheesught: [ 0, 0, { start: 0, end: 0 }],
        canvas_scale: [ 0, 0, { start: 0, end: 0 }],
        canvasCaption_opacity: [ 0, 1, { start: 0, end: 0 }],
        canvasCaption_translateY: [ 20, 0, { start: 0, end: 0 }],
        rectStartY: 0
      }
    }
  ];

  function setCanvasImages(){
    let imgElem;
    for (let i=0; i < sceneInfo[0].values.videoImagesCount; i++){
      imgElem = new Image();
      //imgElem.src = `./image/vid_test/vid_0${i+7}.jpg`
      imgElem.src = `./image/vid2_min/vid2_${i}.jpg`
      sceneInfo[0].objs.videoImages.push(imgElem);  
    }

    let imgElem2;
    for (let i=0; i < sceneInfo[2].values.videoImagesCount; i++){
      imgElem = new Image();
      imgElem.src = `./image/002/IMG_${7027 + i}.JPG`
      sceneInfo[2].objs.videoImages.push(imgElem);
    }

    let imgElem3;
    for (let i=0; i < sceneInfo[3].objs.ImagesPath.length; i++) {
      imgElem3 = new Image();
      imgElem3.src = sceneInfo[3].objs.ImagesPath[i];
      sceneInfo[3].objs.images.push(imgElem3);
    }
  }

  function checkMenu() {
    if (yOffset > 44) {
      document.body.classList.add('local-nav-sticky');
    } else {
      document.body.classList.remove('local-nav-sticky');
    }
  }

  function setLayout(){
    ///각 스크롤 섹션의 높이 세팅
    for (let i=0; i<sceneInfo.length; i++){
      if(sceneInfo[i].type === 'sticky') {
        sceneInfo[i].scrollHeight = sceneInfo[i].heightNum * window.innerHeight; //브라우저 창 높이의 곱
      } else if (sceneInfo[i].type === 'normal') {
        sceneInfo[i].scrollHeight = sceneInfo[i].objs.container.offsetHeight; //원래 defaulf 값
      }
      sceneInfo[i].objs.container.style.height = `${sceneInfo[i].scrollHeight}px`
    }
    
    yOffset = window.pageYOffset;

    let totalScrollHeight = 0; //새로고침해도 currentScene이 제대로 되도록
    for (let i=0; i < sceneInfo.length; i++){
      totalScrollHeight += sceneInfo[i].scrollHeight;
      if (totalScrollHeight >= yOffset){
        currentScene = i;
        break;
      }
    }
    document.body.setAttribute('id', `show-scene-${currentScene}`);

    const heightRatio = window.innerHeight / 1080; /*이 줄의 뜻 알아보기*/
    sceneInfo[0].objs.canvas.style.transform = `translate3d(-50%, -50%, 0) scale(${heightRatio})`;
    sceneInfo[2].objs.canvas.style.transform = `translate3d(-50%, -50%, 0) scale(${heightRatio})`;
  }

  function calcValues(values, currentYOffset){ //현재 씬에서 얼마나 스크롤 됐는지(비율로)  
    let rv;
    /// 현재 씬(스크롤섹션)에서 스크롤된 범위를 비율로 구하기
    const scrollHeight = sceneInfo[currentScene].scrollHeight;
    const scrollRatio = currentYOffset / scrollHeight; //현재 씬의 전체 범위에서 지금 스크롤된 비율

    if (values.length === 3){ 
      ///start ~ end 사이에 애니메이션 실행
      const partScrollStart = values[2].start * scrollHeight; //부분 스크롤 비율
      const partScrollEnd = values[2].end * scrollHeight;
      const partScrollHeight = partScrollEnd - partScrollStart;

      if(currentYOffset >= partScrollStart && currentYOffset <= partScrollEnd) { //해당 범위에 들어오면
        rv = (currentYOffset - partScrollStart) / partScrollHeight * (values[1]-values[0]) + values[0];
      } else if (currentYOffset < partScrollStart) {
        rv = values[0];
      } else if (currentYOffset > partScrollEnd) {
        rv = values[1];
      }
    }else{
      rv = scrollRatio * (values[1]-values[0]) + values[0]; //전체 범위(스크롤에 따라서 0부터 범위 끝까지) + 초기값
    }
    return rv;
  }

  function playAnimation(){
    const objs = sceneInfo[currentScene].objs;
    const values = sceneInfo[currentScene].values;
    const currentYOffset = yOffset - prevScrollHeight; //현재 씬에서 얼만큼 진행했는지
    const scrollHeight = sceneInfo[currentScene].scrollHeight;
    const scrollRatio = currentYOffset / scrollHeight;

    switch (currentScene){ //해당 세션만 애니메이션 플레이
      case 0:
        //console.log('0 play');
        //let sequence = Math.round(calcValues(values.imageSequence, currentYOffset));
        //objs.context.drawImage(objs.videoImages[sequence], 0, 0); /*뒤에 width, height 지정 가능*/
        objs.canvas.style.opacity = calcValues(values.canvas_opacity, currentYOffset);

        if (scrollRatio <= 0.22) { //in out 중간
          //in
          objs.messageA.style.opacity = calcValues(values.messageA_opacity_in, currentYOffset);
          objs.messageA.style.transform = `translate3d(0, ${calcValues(values.messageA_translateY_in, currentYOffset)}%, 0)`;
        } else {
          //out
          objs.messageA.style.opacity = calcValues(values.messageA_opacity_out, currentYOffset);
          objs.messageA.style.transform = `translate3d(0, ${calcValues(values.messageA_translateY_out, currentYOffset)}%, 0)`;
        }

        if (scrollRatio <= 0.42) {
          //in
          objs.messageB.style.opacity = calcValues(values.messageB_opacity_in, currentYOffset);
          objs.messageB.style.transform = `translate3d(0, ${calcValues(values.messageB_translateY_in, currentYOffset)}%, 0)`;
        } else {
          //out 
          objs.messageB.style.opacity = calcValues(values.messageB_opacity_out, currentYOffset);
          objs.messageB.style.transform = `translate3d(0, ${calcValues(values.messageB_translateY_out, currentYOffset)}%, 0)`;
        }

        if (scrollRatio <= 0.62) {
          //in
          objs.messageC.style.opacity = calcValues(values.messageC_opacity_in, currentYOffset);
          objs.messageC.style.transform = `translate3d(0, ${calcValues(values.messageC_translateY_in, currentYOffset)}%, 0)`;
        } else {
          //out 
          objs.messageC.style.opacity = calcValues(values.messageB_opacity_out, currentYOffset);
          objs.messageC.style.transform = `translate3d(0, ${calcValues(values.messageC_translateY_out, currentYOffset)}%, 0)`;
        }

        if (scrollRatio <= 0.82) {
          //in
          objs.messageD.style.opacity = calcValues(values.messageD_opacity_in, currentYOffset);
          objs.messageD.style.transform = `translate3d(0, ${calcValues(values.messageD_translateY_in, currentYOffset)}%, 0)`;
        } else {
          //out 
          objs.messageD.style.opacity = calcValues(values.messageD_opacity_out, currentYOffset);
          objs.messageD.style.transform = `translate3d(0, ${calcValues(values.messageD_translateY_out, currentYOffset)}%, 0)`;
        }

        break;

      case 2:
        //console.log('2 play');
        //let sequence2 = Math.round(calcValues(values.imageSequence, currentYOffset));
        //objs.context.drawImage(objs.videoImages[sequence2], 0, 0);

        if (scrollRatio <= 0.5) {
          //in
          objs.canvas.style.opacity = calcValues(values.canvas_opacity_in, currentYOffset);
        } else {
          //out
          objs.canvas.style.opacity = calcValues(values.canvas_opacity_out, currentYOffset);
        }

        if (scrollRatio <= 0.32) {
          //in
          objs.messageA.style.opacity = calcValues(values.messageA_opacity_in, currentYOffset);
          objs.messageA.style.transform = `translate3d(0, ${calcValues(values.messageA_translateY_in, currentYOffset)}%, 0)`;
        } else {
          //out
          objs.messageA.style.opacity = calcValues(values.messageA_opacity_out, currentYOffset);
          objs.messageA.style.transform = `translate3d(0, ${calcValues(values.messageA_translateY_out, currentYOffset)}%, 0)`;
        }

        if (scrollRatio <= 0.67) {
          //in
          objs.messageB.style.opacity = calcValues(values.messageB_opacity_in, currentYOffset);
          objs.messageB.style.transform = `translate3d(0, ${calcValues(values.messageB_translateY_in, currentYOffset)}%, 0)`;
          objs.pinB.style.transform = `scaleY(${calcValues(values.pinB_scaleY, currentYOffset)})`;
        } else {
          //out 
          objs.messageB.style.opacity = calcValues(values.messageB_opacity_out, currentYOffset);
          objs.messageB.style.transform = `translate3d(0, ${calcValues(values.messageB_translateY_out, currentYOffset)}%, 0)`;
          objs.pinB.style.transform = `scaleY(${calcValues(values.pinB_scaleY, currentYOffset)})`;
        }

        if (scrollRatio <= 0.93) {
          //in
          objs.messageC.style.opacity = calcValues(values.messageC_opacity_in, currentYOffset);
          objs.messageC.style.transform = `translate3d(0, ${calcValues(values.messageC_translateY_in, currentYOffset)}%, 0)`;
          objs.pinC.style.transform = `scaleY(${calcValues(values.pinC_scaleY, currentYOffset)})`;
        } else {
          //out 
          objs.messageC.style.opacity = calcValues(values.messageC_opacity_out, currentYOffset);
          objs.messageC.style.transform = `translate3d(0, ${calcValues(values.messageC_translateY_out, currentYOffset)}%, 0)`;
          objs.pinC.style.transform = `scaleY(${calcValues(values.pinC_scaleY, currentYOffset)})`;
        }

        /// currentScene 3에서 쓰는 캔버스를 미리 그려주기 시작
        if (scrollRatio > 0.9) {
          const objs = sceneInfo[3].objs;
          const values = sceneInfo[3].values;
          const widthRatio = window.innerWidth / objs.canvas.width;
          const heightRatio = window.innerHeight / objs.canvas.height;
          let canvasScaleRatio;
  
          if (widthRatio <= heightRatio) {
            /// 캔버스보다 브라우저 창이 홀쭉한 경우
            canvasScaleRatio = heightRatio;
          } else {
            /// 캔버스보다 브라우저 창이 납작한 경우
            canvasScaleRatio = widthRatio;
          }
  
          objs.canvas.style.transform = `scale(${canvasScaleRatio})`;
          objs.context.fillStyle = 'black';
          objs.context.drawImage(objs.images[0], 0, 0);
  
          /// 캔버스 사이즈에 맞춰 가정한 innerWidth와 innerHeight
          const recalculatedInnerWidth = document.body.offsetWidth / canvasScaleRatio;
          const recalculatedInnerHeight = window.innerHeight / canvasScaleRatio;
  
          const whiteRectWidth = recalculatedInnerWidth * 0.15;
          values.rect1X[0] = (objs.canvas.width - recalculatedInnerWidth) / 2;
          values.rect1X[1] = values.rect1X[0] - whiteRectWidth;
          values.rect2X[0] = values.rect1X[0] + recalculatedInnerWidth - whiteRectWidth;
          values.rect2X[1] = values.rect2X[0] + whiteRectWidth;
  
          /// 좌우 흰색 박스 그리기
          objs.context.fillRect(
            parseInt(values.rect1X[0]),
            0,
            parseInt(whiteRectWidth),
            objs.canvas.height
          );
          objs.context.fillRect(
            parseInt(values.rect2X[0]),
            0,
            parseInt(whiteRectWidth),
            objs.canvas.height
          );
        }

        break;

      case 3:
        // console.log('3 play');
        let step = 0;
        /// 가로/세로 모두 꽉 차게 하기 위해 여기서 세팅(계산 필요)
        const widthRatio = window.innerWidth / objs.canvas.width;
        const heightRatio = window.innerHeight / objs.canvas.height;
        let canvasScaleRatio;

        if (widthRatio <= heightRatio) {
          /// 캔버스보다 브라우저 창이 홀쭉한 경우
          canvasScaleRatio = heightRatio;
        } else {
          /// 캔버스보다 브라우저 창이 납작한 경우
          canvasScaleRatio = widthRatio;
        }

        objs.canvas.style.transform = `scale(${canvasScaleRatio})`;
        objs.context.fillStyle = 'black';
        objs.context.drawImage(objs.images[0], 0, 0);

        /// 캔버스 사이즈에 맞춰 가정한 innerWidth와 innerHeight
        const recalculatedInnerWidth = document.body.offsetWidth / canvasScaleRatio; // 스크롤바 제외
        const recalculatedInnerHeight = window.innerHeight / canvasScaleRatio;

        if (!values.rectStartY) {
          //values.rectStartY = objs.canvas.getBoundingClientRect().top; getBoundingClientRect() 화면상의 요소에 크기와 위치를 가져올 수 있는 메소드
          values.rectStartY = objs.canvas.offsetTop 
          + (objs.canvas.height - objs.canvas.height * canvasScaleRatio) / 2; // 줄어든 스케일 높이만큼 더해줌
          values.rect1X[2].start = ( window.innerHeight / 2 ) / scrollHeight;
          values.rect2X[2].start = ( window.innerHeight / 2 ) / scrollHeight;
          values.rect1X[2].end = values.rectStartY / scrollHeight; // rect1X[2] 타이밍 가지고 있음
          values.rect2X[2].end = values.rectStartY / scrollHeight;
        }

        const whiteRectWidth = recalculatedInnerWidth * 0.15;
        values.rect1X[0] = (objs.canvas.width - recalculatedInnerWidth) / 2;
        values.rect1X[1] = values.rect1X[0] - whiteRectWidth;
        values.rect2X[0] = values.rect1X[0] + recalculatedInnerWidth - whiteRectWidth;
        values.rect2X[1] = values.rect2X[0] + whiteRectWidth;

        /// 좌우 흰색 박스 그리기
        objs.context.fillRect(
          parseInt(calcValues(values.rect1X, currentYOffset)),
          0,
          parseInt(whiteRectWidth),
          objs.canvas.height
        );
        objs.context.fillRect(
          parseInt(calcValues(values.rect2X, currentYOffset)),
          0,
          parseInt(whiteRectWidth),
          objs.canvas.height
        );

        if(scrollRatio < values.rect1X[2].end) { //캔버스가 브라우저 상단에 닿지 않았다면
          step = 1;
          // console.log('캔버스 닿기 전');
          objs.canvas.classList.remove('sticky');
        } else {
          step = 2;
          // console.log('캔버스 닿은 후');
          // 이미지 블렌드
          //imageBlendY: {0, 0, { start : 0, end : 0 }}
          values.blendHeight[0] = 0;
          values.blendHeight[1] = objs.canvas.height;
          values.blendHeight[2].start = values.rect1X[2].end;
          values.blendHeight[2].end = values.blendHeight[2].start + 0.2 //현재씬의 전체 스크롤 높이의 20%, 속도 조절
          const blendHeight = calcValues(values.blendHeight, currentYOffset);

          objs.context.drawImage(objs.images[1],
              0, objs.canvas.height - blendHeight, objs.canvas.width, blendHeight,
              0, objs.canvas.height - blendHeight, objs.canvas.width, blendHeight
              // 이미지와 캔버스의 크기가 다르다면 이미지의 크기 사용, 이미지 객체의 네츄얼 width, height 사용
              // 현재 이미지 크기와 캔버스 크기 똑같이 설정해놨음
            );

          objs.canvas.classList.add('sticky');
          objs.canvas.style.top = `${-(objs.canvas.height - objs.canvas.height * canvasScaleRatio) / 2}px`

          // 올라온 이미지 사이즈 줄이기(단계)
          if(scrollRatio > values.blendHeight[2].end) {
            values.canvas_scale[0] = canvasScaleRatio;
            values.canvas_scale[1] = document.body.offsetWidth / (1.5 * objs.canvas.width); // 줄어든 이미지의 최종값
            values.canvas_scale[2].start = values.blendHeight[2].end;
            values.canvas_scale[2].end = values.canvas_scale[2].start + 0.2; //현재씬의 전체 스크롤 높이의 20%, 축소 처리

            objs.canvas.style.transform = `scale(${calcValues(values.canvas_scale, currentYOffset)})`;
            objs.canvas.style.marginTop = 0;
          }
          // fixed 제거하여 스크롤되어 올라가도록(단계)
          if (scrollRatio > values.canvas_scale[2].end && values.canvas_scale[2].end > 0) { // 초기값이 0이 아닐때
            objs.canvas.classList.remove('sticky');
            objs.canvas.style.marginTop = `${scrollHeight * 0.4}px` //0.2 + 0.2 duration 두개 더하기

            values.canvasCaption_opacity[2].start = values.canvas_scale[2].end;
            values.canvasCaption_opacity[2].end = values.canvasCaption_opacity[2].start + 0.1; // 전체 스크롤 높이에서 10% 동안
            values.canvasCaption_translateY[2].start = values.canvas_scale[2].end;
            values.canvasCaption_translateY[2].end = values.canvasCaption_opacity[2].start + 0.1;
            objs.canvasCaption.style.opacity = calcValues(values.canvasCaption_opacity, currentYOffset);
            objs.canvasCaption.style.transform = `translate3d(0, ${calcValues(values.canvasCaption_translateY, currentYOffset)}%, 0)`;
          }
        }

        break;
    }
  }

  function scrollLoop(){ // 활성화시킬 씬 결정
    enterNewScene = false;
    prevScrollHeight = 0; // 값이 누적되지 않도록 초기화
    for (let i =0; i < currentScene; i++) {
      prevScrollHeight += sceneInfo[i].scrollHeight;
    }

    if (delayedYOffset < prevScrollHeight + sceneInfo[currentScene].scrollHeight) {
      document.body.classList.remove('scroll-effect-end')
    }

    if (delayedYOffset > prevScrollHeight + sceneInfo[currentScene].scrollHeight) {
      enterNewScene = true;
      if (currentScene === sceneInfo.length - 1) {
        document.body.classList.add('scroll-effect-end')
      }
      if (currentScene < sceneInfo.length - 1) {
        currentScene++;
      }
      document.body.setAttribute('id', `show-scene-${currentScene}`); // 시작할때 처리해줬기 때문에 바뀔때만 처리
    }

    if(delayedYOffset < prevScrollHeight) {
      enterNewScene = true;
      if(currentScene === 0) return; /// 브라우저 바운스 효과로 인해 마이너스가 되는 것을 방지(모바일)
      currentScene--;
      document.body.setAttribute('id', `show-scene-${currentScene}`);
    }

    if (enterNewScene) return; // 씬이 바뀌는 순간에는 playAnimation 생략(오차 제거)

    playAnimation();
  }

  function loop() {
    delayedYOffset = delayedYOffset + (yOffset - delayedYOffset) * acc;

    if (!enterNewScene) {
      if (currentScene === 0 || currentScene === 2) {
        const currentYOffset = delayedYOffset - prevScrollHeight;
        const objs = sceneInfo[currentScene].objs;
        const values = sceneInfo[currentScene].values;
        let sequence = Math.round(calcValues(values.imageSequence, currentYOffset));
        if (objs.videoImages[sequence]) {
          objs.context.drawImage(objs.videoImages[sequence], 0, 0);
        }
      }
    }

    rafId = requestAnimationFrame(loop);

    if (Math.abs(yOffset - delayedYOffset) < 1) {
      cancelAnimationFrame(rafId);
      rafState = false;
    }
  }
  
  window.addEventListener('load', () => {

    document.body.classList.remove('before-load');
    setLayout();
    sceneInfo[0].objs.context.drawImage(sceneInfo[0].objs.videoImages[0], 0, 0);

    let tempYOffset = yOffset;
    let tempScrollCount = 0;
    if (yOffset >0) {
      let siId = setInterval(() => { /*새로고침 버그 수정(자동 y 스크롤)*/
        window.scrollTo(0, tempYOffset);
        tempYOffset += 2; /*2픽셀씩 20번*/

        if (tempScrollCount > 20) {
          clearInterval(siId);
        }
        tempScrollCount++
      }, 20);
    }

    window.addEventListener('scroll', () => {
      yOffset = window.pageYOffset; // pageYOffset 현재 스크롤한 위치을 알 수 있음
      scrollLoop();
      checkMenu();
      //부드러운 감속
      if (!rafState) {
        rafId = requestAnimationFrame(loop);
        rafState = true;
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900){
        window.location.reload();
        /*3번 scene 제외하고는 제대로 동작 
        setLayout(); // 모바일에서는 리사이즈X
        sceneInfo[3].values.rectStartY = 0; // 리사이즈 대응
        */
      }
    }); //창을 세로로 줄일 때, 다시 높이 세팅

    window.addEventListener('orientationchange', () => {
      scrollTo(0, 0);
      setTimeout(()=> {
        window.location.reload();
      }, 500);
      /*3번 scene 제외하고는 제대로 동작 
      setTimeout(setLayout, 500);
      */
    }); // 앞에 함수는 모바일 기기에서 방향 바꿀때

    document.querySelector('.loading').addEventListener('transitionend', (e) => {
      document.body.removeChild(e.currentTarget);
    }); // transition이 끝날때 
  });

  setCanvasImages();
  
})();