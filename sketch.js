// To avoid unecessary sound affecting the mic, can turn off the music especially because ik for my macbook the mic and the speaker is next to each other :<

// This project is made to be best viewable on Samsung galaxy S23+


let state = "DEFLATED";
let prev_state = "";
let surprise = "";
let timestamp = 0;
let balloonX = 190, balloonY = 210, balloonSize = 100;
let needleX = 300, needleY = 200, needleSize = 20;
let grabbed = false;
let aircapacity = 0; //when ppl blow the number goes up
let isNervous = false;
let currentBalloonSize = 150; // Initial size of the deflated balloon (300% bigger)
let targetBalloonSize = 150; // Initial size of the deflated balloon (300% bigger)
let deflatedImg, inflatedImg, overInflatedImg, veryOverInflatedImg, takenAwayImg;
let inflatedNervousImg, overInflatedNervousImg, veryOverInflatedNervousImg;
let partyHatImg;
let bgColor = [255, 255, 0]; // Initial background color (yellow)
let lastBlowTime = 0;
let canPressB = true; // Flag to control if "b" button can be pressed
let isTimeout = false; // Add this flag to control the nervous state during the timeout
let surpriseGenerated = false; // Add this flag to check if a surprise has been generated
let loadingBurst = true;
let surpriseTimeout = false;
let surpriseRevealStartedAt = 0;
let surpriseBurstParticles = [];
let burstTimeout = false;
let burstLinesStartedAt = 0;
let burstCount = 0; // Add this line to declare the score variable
let sourGummyFont; // Add this line to declare the SourGummy font variable
const initialTimer = 30;
let timer = initialTimer;
let lastTimerUpdate = 0;
let isButtonPressed = false;
let gameState = "HOME"; // Add this line to declare the game state variable
let countdownTimer = 3; // Add a countdown timer variable
let needleButtonImg, partyButtonImg, needleImg;
let circusMusic, homescreenMusic, countdownMusic, endscreenMusic, partyMusic;
let inflateSound, burstSound, surpriseSound;
let gameplayTheme = "CIRCUS";
let buttonSize = 81; // Adjust the size of the buttons as needed (10% smaller)
let circleSize = buttonSize + 18; // Adjust the size of the circle as needed (10% smaller)
let takingNeedle = false;
// The needle button is pressed first, then dragged to BooBoo. Keep its bounds
// in one place so mouse and touch input use the exact same target.
let paused = false;
let playEndSound = true;
// Use one activation threshold everywhere. The sound meter is already sized
// responsively, so a phone gets the same blow sensitivity as desktop while
// keeping its mobile-friendly layout.
const soundThreshold = 0.03;
let mic;
let highscore = 0;
let burstCounted = false;
let isMuted = false;
const muteButtonSize = 48 * 0.85;
const muteButtonMargin = 18;
// Make the music slider's 100% position equal -12 dB without
// changing the punch of the game sound effects.
const defaultMusicGain = Math.pow(10, -12 / 20);
// These four assets start 10 dB below their previous default levels.
const reducedAssetGain = Math.pow(10, -10 / 20);
const countdownGain = Math.pow(10, 4 / 20);
let musicVolume = 1;
let isVolumeControlOpen = false;
let isAdjustingMusicVolume = false;
let lastVolumeInteraction = 0;
const volumeControlTimeout = 2000;
// iOS requires a tap before it will share motion data. Android and desktop
// browsers do not need this extra permission step.
let motionPermissionRequested = false;

function preload() {
  deflatedImg = loadImage("PicturesAssets/Deflated.gif");
  inflatedImg = loadImage("PicturesAssets/Inflated.gif"); // Change to Inflated.gif
  overInflatedImg = loadImage("PicturesAssets/OverInflated.gif"); // Change to OverInflated.gif
  veryOverInflatedImg = loadImage("PicturesAssets/VeryOverInflated.gif");
  inflatedNervousImg = loadImage("PicturesAssets/InflatedNervous.gif"); // Change to InflatedNervous.gif
  overInflatedNervousImg = loadImage("PicturesAssets/OverInflatedNervous.gif"); // Change to OverInflatedNervous.gif
  veryOverInflatedNervousImg = loadImage("PicturesAssets/VeryOverInflatedNervous.gif");
  partyHatImg = loadImage("PicturesAssets/Partyhat.png"); // Preload the party hat image
  sourGummyFont = loadFont("Fonts/SourGummy-VariableFont_wdth,wght.ttf"); // Preload the SourGummy font
  // takenAwayImg = loadImage("PicturesAssets/taken-away.png");
  needleButtonImg = loadImage("PicturesAssets/Needlebutton.png");
  partyButtonImg = loadImage("PicturesAssets/Partybutton.png");
  needleImg = loadImage("PicturesAssets/Needlebutton.png");
  circusMusic = loadSound("sound/circus.mp3");
  homescreenMusic = loadSound("sound/homescreen.mp3");
  countdownMusic = loadSound("sound/countdown.mp3");
  endscreenMusic = loadSound("sound/endscreen.mp3");
  partyMusic = loadSound("sound/party.mp3");
  inflateSound = loadSound("sound/inflate.mp3");
  burstSound = loadSound("sound/burst.mp3");
  surpriseSound = loadSound("sound/surprise.mp3");
  circusMusic.playMode('restart');
  homescreenMusic.playMode('restart');
  homescreenMusic.loop();
}

function setup() {
  setShakeThreshold(40)
  createCanvas(windowWidth, windowHeight); // Use windowWidth and windowHeight for canvas size
  balloonX = width / 2;
  balloonY = height / 2;
  setupMic();
  try {
    isMuted = localStorage.getItem("boobooMuted") === "true";
    const savedMusicVolume = localStorage.getItem("boobooMusicVolume");
    if (savedMusicVolume !== null && Number.isFinite(Number(savedMusicVolume))) {
      musicVolume = constrain(Number(savedMusicVolume), 0, 1);
    }
  } catch (error) {
    // Some local previews block storage; volume controls still work for this visit.
    isMuted = false;
  }
  applyMuteState();

  // p5 receives mouse events from the canvas, but a desktop player can release
  // after dragging beyond its edge. Clear the tool in that case too, so the
  // next drag always starts from the needle button just like a touch drag.
  window.addEventListener("mouseup", releaseNeedle);
}

function draw() {
  micInflate();
  playScreenMusic();

  if (gameState === "HOME") {
    showHomeScreen(); // Show the home screen if the game state is "HOME"
  } else if (gameState === "COUNTDOWN") {
    showCountdownScreen(); // Show the countdown screen if the game state is "COUNTDOWN"
  } else {
    drawGameplayBackground();

    if (state !== "BURST") {
      currentBalloonSize = lerp(currentBalloonSize, targetBalloonSize, 0.1);
    } else {
      currentBalloonSize = targetBalloonSize;
    }
    // Match BooBoo's gentle home-screen bob without changing its logical
    // center, so resizing and round resets remain stable.
    push();
    translate(0, getGameplayBalloonSway());
    displayState();
    pop();
    dragNeedle();
    textSize(16); // Adjust text size for better readability on different screen sizes
    // text("State: " + state, 50, 50);
    // text("Nervous: " + isNervous, 50, 100);
    // text("Surprise: " + surprise, 50, 75);

    if (state === "BURST" && !loadingBurst) {
      generateSurprise();
    }

    // Display party hat if background is black
    if (bgColor[0] === 0 && bgColor[1] === 0 && bgColor[2] === 0) {
      let hatSize = currentBalloonSize * 0.7; // Scale the hat size based on the balloon size
      image(partyHatImg, balloonX - hatSize / 2, balloonY + getGameplayBalloonSway() - currentBalloonSize / 2 - hatSize + 60, hatSize, hatSize); // Adjust position and size as needed
    }

    // Decrease air capacity slowly if not pressing "b" for specific states
    if (millis() - lastBlowTime > 1000 && aircapacity > 0 && (state === "INFLATED" || state === "OVER_INFLATED" || state === "VERY_OVER_INFLATED") && bgColor[0] !== 0) {
      aircapacity -= 0.2;
      updateBalloonState();
    }

    
    // Keep the round information together in the same warm, hand-painted wood
    // treatment used by the home-screen signpost.
    drawGameplayHud();
    strokeCap(ROUND);

    // Reset stroke settings to avoid affecting text rendering
    noStroke();

    // Update the timer from elapsed time so the 30-second round is not tied to
    // the device's frame rate.
    if (!paused && timer > 0 && millis() - lastTimerUpdate >= 1000) {
      const elapsedSeconds = floor((millis() - lastTimerUpdate) / 1000);
      timer = max(0, timer - elapsedSeconds);
      lastTimerUpdate += elapsedSeconds * 1000;
    }

    // Display the buttons at the bottom of the screen if the game state is not "END"
    if (gameState !== "END" && gameState !== "HOME" && gameState !== "COUNTDOWN") {
      const needleButton = getNeedleButtonBounds();
      drawNeedleButtonFrame(needleButton);
      imageMode(CENTER);
      image(needleButtonImg, needleButton.x, needleButton.y, needleButton.size, needleButton.size);
      imageMode(CORNER);
    }

    drawNeedle()
    soundBar();
    if (timer <= 0 && !surpriseTimeout && !burstTimeout && loadingBurst) {
      showEndScreen(); // Show the end screen when the timer reaches 0
    }

  }

  if (isVolumeControlOpen && millis() - lastVolumeInteraction >= volumeControlTimeout) {
    isVolumeControlOpen = false;
    isAdjustingMusicVolume = false;
  }
  drawMuteButton();
}

// The gameplay screen shares the home screen's meadow, keeping the world
// visually continuous without affecting any game state or interaction.
function drawGameplayBackground() {
  push();
  drawNatureBackground();
  pop();
}

// Keep the gameplay character in sync with the home screen's friendly float.
function getGameplayBalloonSway() {
  return sin(millis() / 380) * 5;
}

function drawGameplayHud() {
  const compact = width < 600 || height < 720;
  // Keep the scoreboard compact so the score and timer read as one group.
  // This remains the layout scale: shortening a board must not shrink the
  // balloon, multiplier, score, timer, or type.
  const layoutW = min(width - (compact ? 28 : 48), 520);
  const highscoreBadgeH = layoutW * (84 / 668);
  const tileH = layoutW * 0.20;
  const rowGap = layoutW * 0.04;
  const plaqueTopInset = layoutW * 0.003;
  const scoreTileW = layoutW * 0.455;
  const tileGap = layoutW * 0.018;
  const timerTileW = tileH;
  const rowW = scoreTileW + tileGap + timerTileW;
  // Preserve the HUD contents at their current scale, but halve the empty
  // wood on both the left and right of the score/timer row.
  const originalSidePadding = (layoutW - rowW) / 2;
  const panelW = rowW + originalSidePadding;
  // Use the same enlarged gap above and below the score/timer row.
  const panelH = plaqueTopInset + highscoreBadgeH + rowGap + tileH + rowGap;
  const panelX = width / 2;
  const panelTop = (compact ? 18 : 24) + 40;
  const panelY = panelTop + panelH / 2;
  const corner = compact ? 18 : 22;

  push();
  rectMode(CENTER);
  // Keep the original layered wood treatment, reshaped into the reference's
  // wide board with its narrow dark rim and softly highlighted face.
  noStroke();
  // Dark backing is a restrained edge below and to the right of the wood.
  fill(105, 58, 34, 210);
  rect(panelX + 6, panelY + 9, panelW, panelH, corner);
  fill(151, 85, 43);
  // Bring the middle-brown board forward slightly for a fuller wood rim.
  rect(panelX + 2, panelY + 3, panelW, panelH, corner);
  // Use the final scoreboard's wider middle-brown border around the face.
  fill(194, 119, 57);
  rect(panelX, panelY - panelH * 0.025, panelW * 0.95, panelH * 0.92, corner - 2);
  fill(239, 166, 85, 155);
  rect(panelX - panelW * 0.03, panelTop + panelH * 0.055, panelW * 0.82, max(2, panelH * 0.018), 4);

  stroke(132, 76, 39, 95);
  strokeWeight(max(1.5, panelH * 0.012));
  for (let grain = 0; grain < 4; grain++) {
    const grainY = panelTop + panelH * (0.22 + grain * 0.18);
    line(panelX - panelW * 0.43, grainY, panelX - panelW * 0.16, grainY + grain * 1.2);
    line(panelX + panelW * 0.12, grainY - grain, panelX + panelW * 0.43, grainY + grain);
  }

  textFont(sourGummyFont);
  textAlign(CENTER, CENTER);

  // The metal plaque is pinned flush to the top of the board as in the
  // reference, leaving a generous wooden field beneath it.
  // Base plaque sizing on the board width so tightening the board does not
  // make the high-score row itself smaller.
  const highscoreBadgeY = panelTop + plaqueTopInset + highscoreBadgeH / 2;
  const plaqueNailSize = max(8, highscoreBadgeH * 0.30);
  const highscoreLabel = "Highscore: " + highscore;
  const highscoreTextSize = layoutW * (44 / 668);
  textSize(highscoreTextSize);
  const labelHalfW = textWidth(highscoreLabel) / 2;
  const originalHighscoreBadgeW = layoutW * 0.94;
  const originalNailInsetX = originalHighscoreBadgeW * 0.405;
  const originalLabelGap = max(0, originalNailInsetX - plaqueNailSize / 2 - labelHalfW);
  // Keep only 60% of the current padding between the label and each nail.
  // The current gap is half of the original one, so 60% of it is 30% of
  // originalLabelGap.
  const plaqueNailInsetX = labelHalfW + plaqueNailSize / 2 + originalLabelGap * 0.30;
  // Reduce the remaining space between each outer nail and the plaque edge by
  // the same 40%, without changing the width of the wooden board behind it.
  const originalOuterPadding = max(
    0,
    panelW * 0.94 / 2 - plaqueNailInsetX - plaqueNailSize / 2
  );
  const highscoreBadgeW =
    (plaqueNailInsetX + plaqueNailSize / 2 + originalOuterPadding * 0.60) * 2;

  // Suspend the score board from its two plaque nails.  The links are drawn
  // before the metal plate and nail heads so they look tucked underneath them.
  const chainTopY = max(8, panelTop - min(52, panelH * 0.48));
  drawSilverChain(
    panelX - plaqueNailInsetX,
    chainTopY,
    panelX - plaqueNailInsetX,
    highscoreBadgeY,
    plaqueNailSize
  );
  drawSilverChain(
    panelX + plaqueNailInsetX,
    chainTopY,
    panelX + plaqueNailInsetX,
    highscoreBadgeY,
    plaqueNailSize
  );

  // Cool silver face and grey edge make the badge read like a metal plate.
  fill(198, 205, 208);
  stroke(112, 121, 125);
  strokeWeight(max(4, layoutW * 0.008));
  rect(
    panelX,
    highscoreBadgeY,
    highscoreBadgeW,
    highscoreBadgeH,
    max(8, highscoreBadgeH * 0.12)
  );

  // Use the final scorecard's rounded, charcoal-metal fixtures and matching
  // proportional inset from each edge of the wider plaque.
  for (const nailX of [panelX - plaqueNailInsetX, panelX + plaqueNailInsetX]) {
    noStroke();
    fill(71, 81, 88);
    ellipse(nailX, highscoreBadgeY, plaqueNailSize, plaqueNailSize);
    fill(211, 220, 222);
    ellipse(
      nailX - plaqueNailSize * 0.14,
      highscoreBadgeY - plaqueNailSize * 0.14,
      plaqueNailSize * 0.36,
      plaqueNailSize * 0.36
    );
  }

  noStroke();
  // Match the game's navy type treatment.
  fill(36, 56, 84);
  textSize(highscoreTextSize);
  text(highscoreLabel, panelX, highscoreBadgeY - layoutW * 0.008);

  // Keep the score box and timer side by side as one centered group.
  const tileTop = highscoreBadgeY + highscoreBadgeH / 2 + rowGap;
  const scoreTileLeft = panelX - rowW / 2;
  const timerTileLeft = scoreTileLeft + scoreTileW + tileGap;
  const tileY = tileTop + tileH / 2;

  // The score keeps its pale inset; the timer sits directly on the board.
  noStroke();
  fill(171, 89, 47, 145);
  rect(scoreTileLeft + scoreTileW / 2, tileY + panelH * 0.008, scoreTileW, tileH, corner * 0.65);
  fill(239, 157, 96);
  rect(scoreTileLeft + scoreTileW / 2, tileY, scoreTileW * 0.965, tileH * 0.94, corner * 0.50);

  const scoreCenterX = scoreTileLeft + scoreTileW / 2;
  const scoreY = tileY - tileH * 0.045;
  const scoreTextY = scoreY - 7;
  const scoreTextSize = layoutW * 0.159;
  const multiplierTextSize = layoutW * 0.071;
  const scoreLabel = String(burstCount);
  const multiplierGap = 5;
  const iconMultiplierGap = 6;
  const scoreStrokeWeight = max(6, layoutW * 0.019);

  // Measure both labels so the visible gap remains exactly 5 px at every
  // viewport size and for scores with any number of digits.
  textSize(scoreTextSize);
  const scoreTextW = textWidth(scoreLabel);
  // Shift the balloon and multiplier group 8px to the right within the tile.
  const scoreTextX = scoreCenterX + scoreTileW * 0.101 + 8;
  const scoreLeft = scoreTextX - scoreTextW / 2 - scoreStrokeWeight / 2;

  textSize(multiplierTextSize);
  const multiplierW = textWidth("x");
  const multiplierX = scoreLeft - multiplierGap - scoreStrokeWeight / 2 - multiplierW / 2;
  const multiplierLeft = multiplierX - multiplierW / 2 - scoreStrokeWeight / 2;

  // Size the balloon from the visible height of a stroked "0", then reduce it
  // slightly so it stays secondary to the score.
  textSize(scoreTextSize);
  const zeroMetrics = drawingContext.measureText("0");
  const measuredZeroGlyphH = zeroMetrics.actualBoundingBoxAscent + zeroMetrics.actualBoundingBoxDescent;
  const zeroGlyphH = measuredZeroGlyphH || textAscent() + textDescent();
  const balloonBodyHeightRatio = 1.03;
  const scoreIconScale = 0.68; // 15% smaller than the previous 0.8 scale.
  const scoreIconH = ((zeroGlyphH + scoreStrokeWeight) / balloonBodyHeightRatio) * scoreIconScale;
  const scoreIconW = scoreIconH * (42 / 54);
  // The widest point of this cubic balloon silhouette is 46.5% of balloonW
  // from its centre. Position from that visible edge to keep a true 6px gap.
  const scoreIconX = multiplierLeft - iconMultiplierGap - scoreIconW * 0.465;
  drawBalloonSilhouette(
    scoreIconX,
    scoreY - scoreIconH * 0.015 - 5,
    scoreIconW,
    scoreIconH,
    [105, 58, 34],
    255,
    true
  );

  fill(255, 248, 215);
  stroke(105, 58, 34);
  strokeWeight(scoreStrokeWeight);
  textAlign(CENTER, CENTER);
  textSize(multiplierTextSize);
  text("x", multiplierX, scoreTextY + tileH * 0.02);

  // Display the score naturally (5 rather than 05); the small x now carries
  // the multiplier treatment that the leading zero previously occupied.
  // This is 30% smaller than the previous reference-scaled score size.
  textSize(scoreTextSize);
  text(scoreLabel, scoreTextX, scoreTextY);

  // With no rectangular backing, the ring becomes the timer's full visual
  // boundary. Include its outer stroke when matching the score box height.
  const proportionalTimerRadius = tileH / 2.16;
  const timerOuterStroke = max(8, proportionalTimerRadius * 0.16);
  const timerRadius = (tileH - timerOuterStroke) / 2;
  drawPieChartTimer(timerTileLeft + timerTileW / 2, tileY, timerRadius, timer / initialTimer);
  pop();
}

// A sequence of alternating oval links gives the scoreboard's supports a
// simple silver chain texture while remaining clear at compact phone sizes.
function drawSilverChain(startX, startY, endX, endY, nailSize) {
  const linkSize = max(7, nailSize * 0.72);
  const chainLength = dist(startX, startY, endX, endY);
  const linkCount = max(3, floor(chainLength / (linkSize * 0.72)));

  push();
  noFill();
  strokeWeight(max(1.5, linkSize * 0.22));
  for (let link = 0; link <= linkCount; link++) {
    const progress = link / linkCount;
    // Keep each chain perfectly vertical, with its final link at the nail.
    const x = lerp(startX, endX, progress);
    const y = lerp(startY, endY, progress);
    stroke(link % 2 ? 103 : 224, link % 2 ? 115 : 229, link % 2 ? 122 : 234);
    push();
    translate(x, y);
    rotate(link % 2 ? HALF_PI : 0);
    ellipse(0, 0, linkSize * 0.62, linkSize);
    pop();
  }
  pop();
}

function drawGameplayHeart(x, y, size, heartColor) {
  push();
  translate(x, y);
  fill(heartColor);
  noStroke();
  beginShape();
  vertex(0, size * 0.9);
  bezierVertex(-size * 1.5, 0, -size * 0.8, -size, 0, -size * 0.25);
  bezierVertex(size * 0.8, -size, size * 1.5, 0, 0, size * 0.9);
  endShape(CLOSE);
  pop();
}

function getMuteButtonBounds() {
  return {
    x: width - muteButtonSize - muteButtonMargin,
    y: muteButtonMargin,
    size: muteButtonSize
  };
}

function getVolumeSliderBounds() {
  const button = getMuteButtonBounds();
  const widthLimit = min(180, width - muteButtonMargin * 2);
  const panelH = 46;
  return {
    x: max(muteButtonMargin, button.x + button.size - widthLimit),
    y: button.y + button.size + 10,
    w: widthLimit,
    h: panelH,
    trackX: max(muteButtonMargin, button.x + button.size - widthLimit) + 14,
    trackY: button.y + button.size + 10 + 30,
    trackW: widthLimit - 28
  };
}

function isMuteButtonPressed() {
  const button = getMuteButtonBounds();
  return mouseX >= button.x && mouseX <= button.x + button.size &&
    mouseY >= button.y && mouseY <= button.y + button.size;
}

function isVolumeSliderPressed() {
  if (!isVolumeControlOpen) return false;
  const slider = getVolumeSliderBounds();
  return mouseX >= slider.x && mouseX <= slider.x + slider.w &&
    mouseY >= slider.y && mouseY <= slider.y + slider.h;
}

function setMusicVolumeFromPointer() {
  const slider = getVolumeSliderBounds();
  musicVolume = constrain((mouseX - slider.trackX) / slider.trackW, 0, 1);
  lastVolumeInteraction = millis();
  // Moving the slider is also a clear intent to hear the music again.
  isMuted = false;
  try {
    localStorage.setItem("boobooMuted", "false");
    localStorage.setItem("boobooMusicVolume", musicVolume);
  } catch (error) {
    // Storage is optional for local previews.
  }
  applyMuteState();
}

function applyMuteState() {
  const musicGain = isMuted ? 0 : defaultMusicGain * musicVolume;
  [circusMusic, partyMusic]
    .forEach((sound) => {
      if (sound) sound.setVolume(musicGain * reducedAssetGain);
    });
  [homescreenMusic, endscreenMusic]
    .forEach((sound) => {
      if (sound) sound.setVolume(musicGain);
    });
  if (countdownMusic) countdownMusic.setVolume(musicGain * countdownGain);
  [inflateSound, burstSound, surpriseSound].forEach((sound) => {
    if (sound) sound.setVolume(isMuted ? 0 : reducedAssetGain);
  });
}

function toggleMute() {
  isMuted = !isMuted;
  try {
    localStorage.setItem("boobooMuted", isMuted);
  } catch (error) {
    // Storage is optional, so do not let a blocked local preview interrupt play.
  }
  applyMuteState();
}

function drawMuteButton() {
  const button = getMuteButtonBounds();
  push();
  rectMode(CORNER);
  stroke(36, 56, 84);
  strokeWeight(4);
  fill(isVolumeControlOpen ? color(255, 225, 143) : color(255, 245));
  rect(button.x, button.y, button.size, button.size, 12);

  // Speaker icon, with a slash while muted. Keep the icon 15% smaller than
  // the original and use a rounded, symmetrical trapezium for its horn.
  const iconScale = 0.85;
  const iconCenterX = button.x + button.size / 2;
  const iconCenterY = button.y + button.size / 2;
  const scaledX = (x) => iconCenterX + (x - 24) * iconScale;
  const scaledY = (y) => iconCenterY + (y - 26) * iconScale;

  noStroke();
  fill(36, 56, 84);
  rect(scaledX(12), scaledY(21), 9 * iconScale, 10 * iconScale, 2 * iconScale);

  // A four-sided horn prevents the speaker from looking cut off; the matching
  // top and bottom edges keep it symmetrical about the icon's centre line.
  beginShape();
  vertex(scaledX(21), scaledY(23));
  quadraticVertex(scaledX(21), scaledY(21), scaledX(22.7), scaledY(19.9));
  vertex(scaledX(30.3), scaledY(15.1));
  quadraticVertex(scaledX(32), scaledY(14), scaledX(32), scaledY(16));
  vertex(scaledX(32), scaledY(36));
  quadraticVertex(scaledX(32), scaledY(38), scaledX(30.3), scaledY(36.9));
  vertex(scaledX(22.7), scaledY(32.1));
  quadraticVertex(scaledX(21), scaledY(31), scaledX(21), scaledY(29));
  endShape(CLOSE);
  if (isMuted) {
    stroke(238, 75, 43);
    strokeWeight(4 * iconScale);
    line(scaledX(11), scaledY(11), scaledX(37), scaledY(37));
  } else {
    noFill();
    stroke(36, 56, 84);
    strokeWeight(3 * iconScale);
    // Three short straight sound marks, radiating from the speaker.
    line(scaledX(34), scaledY(20), scaledX(38), scaledY(17));
    line(scaledX(35), scaledY(26), scaledX(40), scaledY(26));
    line(scaledX(34), scaledY(32), scaledX(38), scaledY(35));
  }
  pop();

  if (isVolumeControlOpen) drawMusicVolumeSlider();
}

function drawMusicVolumeSlider() {
  const slider = getVolumeSliderBounds();
  const knobX = slider.trackX + slider.trackW * musicVolume;
  const percentage = round(musicVolume * 100);

  push();
  rectMode(CORNER);
  stroke(36, 56, 84);
  strokeWeight(3);
  fill(255, 248, 215, 248);
  rect(slider.x, slider.y, slider.w, slider.h, 12);

  noStroke();
  fill(36, 56, 84);
  textAlign(LEFT, CENTER);
  textFont(sourGummyFont);
  textSize(14);
  text("MUSIC " + percentage + "%", slider.x + 14, slider.y + 13);

  stroke(211, 220, 215);
  strokeWeight(7);
  strokeCap(ROUND);
  line(slider.trackX, slider.trackY, slider.trackX + slider.trackW, slider.trackY);
  stroke(238, 141, 54);
  line(slider.trackX, slider.trackY, knobX, slider.trackY);
  fill(255, 214, 103);
  stroke(36, 56, 84);
  strokeWeight(2.5);
  circle(knobX, slider.trackY, 15);
  pop();
}

function playScreenMusic() {
  if (gameState === "HOME") {
    playEndSound = true;
    endscreenMusic.stop();
    if (!homescreenMusic.isPlaying()) {
      homescreenMusic.play();
    }
  } else if (gameState === "COUNTDOWN") {
    homescreenMusic.stop();
    if (!countdownMusic.isPlaying()) {
      countdownMusic.play();
    }
  } else if (timer > 0) {
    playEndSound = true;
    endscreenMusic.stop();
    countdownMusic.stop();
    if (isTimeout) {
      circusMusic.stop();
      if (!partyMusic.isPlaying()) {
        partyMusic.play();
      }
    } else if (!circusMusic.isPlaying()) {
      partyMusic.stop();
      circusMusic.play();
    }
  } else {
    circusMusic.stop();
    if (!endscreenMusic.isPlaying() && playEndSound) {
      endscreenMusic.play();
      playEndSound = false;
    }
  }
}

function setupMic() {
  mic = new p5.AudioIn(); // Create microphone object
  mic.start(); // Start capturing audio
}

function micInflate() {
  let vol = mic.getLevel(); // Get the microphone input level
  if (vol >= getSoundThreshold() && canPressB && timer > 0 && gameState !== "COUNTDOWN" && gameState !== "HOME") {
    blowAir(); // Inflate the balloon
  } else {
    inflateSound.stop();
  }
}

function getSoundThreshold() {
  return soundThreshold;
}

function drawPieChartTimer(x, y, radius, percentage) {
  noFill();
  stroke(105, 58, 34);
  strokeWeight(max(8, radius * 0.16) + 2);
  arc(x, y, radius * 2, radius * 2, -HALF_PI, -HALF_PI + TWO_PI * percentage);
  
  stroke(255, 248, 215);
  strokeWeight(max(4, radius * 0.085));
  arc(x, y, radius * 2, radius * 2, -HALF_PI, -HALF_PI + TWO_PI * percentage);
  
  // Draw the timer text inside the pie chart
  fill(255, 248, 215);
  stroke(105, 58, 34);
  strokeWeight(max(4, radius * 0.085) + 2);
  textSize(radius * 0.812); // 40% larger than the previous timer text
  textAlign(CENTER, CENTER);
  // The typeface sits optically low, so lift it slightly within the ring.
  text(timer + "s", x, y - radius * 0.08);
}

function keyPressed() {
  if (canPressB && gameState === "PLAY") {
    if (keyCode === 32) {
      partyMode();
      return false; // Keep Space from scrolling the page on desktop.
    }

    switch (key) {
      case "b":
        blowAir();
        lastBlowTime = millis();
        break;
      case "g":
        grabBalloon();
        break;
      case "n":
        dragNeedle();
        break;
      case "p":
        pokeNeedle();
        break;
    }
  }
}

function requestMotionPermission() {
  if (motionPermissionRequested ||
      typeof DeviceMotionEvent === "undefined" ||
      typeof DeviceMotionEvent.requestPermission !== "function") {
    return;
  }

  motionPermissionRequested = true;
  DeviceMotionEvent.requestPermission()
    .catch(() => {
      // A declined permission simply leaves shake mode unavailable on iOS.
      motionPermissionRequested = false;
    });
}

function partyMode() {
  if ((state === "INFLATED" || state === "OVER_INFLATED" || state === "VERY_OVER_INFLATED") && !isTimeout) {
    canPressB = false; // Disable other key presses
    bgColor = [0, 0, 0]; // Change background to black
    isTimeout = true; // Set the timeout flag
    console.log("Party mode activated!");
    paused = true;
    gameplayTheme = "PARTY";
    setTimeout(() => {
      bgColor = [255, 255, 0]; // Reset background color to yellow
      gameplayTheme = "CIRCUS";
      canPressB = true; // Re-enable key presses
      isTimeout = false; // Reset the timeout flag
      paused = false;
    }, 5000); // 10 seconds timeout
  }
}

// put more surprises inside
function generateSurprise() {
  // Set a timeout to revert back to the deflated state after 5 seconds
  if (!surpriseTimeout) {
    if (!surpriseSound.isPlaying()) {
      surpriseSound.play();
    }
    surpriseTimeout = true;
    burstCounted = false;
    setTimeout(() => {
        canPressB = true; // Re-enable "b" button press
        state = "DEFLATED";
        aircapacity = 0;
        targetBalloonSize = 150; // Set the size to 150px when deflated
        currentBalloonSize = targetBalloonSize; // Immediately set the size to deflated
        bgColor = [255, 255, 0]; // Reset background color to yellow
        gameplayTheme = "CIRCUS";
        surpriseGenerated = false; // Reset the flag after the surprise is handled
        surpriseRevealStartedAt = 0;
        surpriseBurstParticles = [];
        surpriseTimeout = false;
        burstTimeout = false;
        loadingBurst = true;
    }, 2000);
  }
}

function getRandomSurprise() {
  surpriseGenerated = true; // Set the flag to true after generating a surprise
  let surprises = ["Candy", "Smiley Face", "Plushies"]; // Add more surprises here
  const selectedSurprise = random(surprises);
  createSurpriseBurstParticles(selectedSurprise);
  return selectedSurprise;
}

function getsurpriseColor(surprise) {
  if (surprise === "Candy") {
    gameplayTheme = "CANDY";
  } else if (surprise === "Smiley Face") {
    gameplayTheme = "SMILEY";
  } else if (surprise === "Plushies") {
    gameplayTheme = "HEARTS";
  }
}

// Give every prize piece a unique, stable trajectory for this particular pop.
function createSurpriseBurstParticles(type) {
  const count = type === "Candy" ? 7 : 5;
  surpriseBurstParticles = Array.from({ length: count }, () => ({
    angle: random(TWO_PI),
    distance: random(0.72, 1.32),
    rotation: random(-PI, PI)
  }));
}

// Draw the prize directly so the surprise reveal does not depend on image assets.
// Every piece travels outward once from the pop point, then remains still.
function drawSurprise(type, x, y, size) {
  const unit = size / 150;
  const elapsed = millis() - surpriseRevealStartedAt;
  const progress = constrain(elapsed / 3150, 0, 1);
  // Slightly soften the ease-out so prizes take a beat before accelerating.
  const burst = 1 - pow(1 - progress, 2.4);
  // Make the prizes leave the visible play area instead of stopping beside
  // the balloon. Their staggered distances keep the explosion feeling lively.
  const exitDistance = max(width, height) * 1.15;

  push();
  translate(x, y);
  strokeJoin(ROUND);

  if (type === "Candy") {
    for (let i = 0; i < 7; i++) {
      const particle = surpriseBurstParticles[i];
      if (!particle) continue;
      const distance = exitDistance * particle.distance * burst;
      push();
      translate(cos(particle.angle) * distance, sin(particle.angle) * distance);
      rotate(particle.rotation * burst);
      noStroke();
      fill(i % 2 ? "#7ad7ff" : "#ff76aa");
      triangle(-25 * unit, 0, -13 * unit, -13 * unit, -13 * unit, 13 * unit);
      triangle(25 * unit, 0, 13 * unit, -13 * unit, 13 * unit, 13 * unit);
      stroke("#7a3d73");
      strokeWeight(2 * unit);
      fill(i % 2 ? "#ffe15b" : "#a87bf4");
      rectMode(CENTER);
      rect(0, 0, 31 * unit, 20 * unit, 7 * unit);
      pop();
    }
  } else if (type === "Smiley Face") {
    for (let i = 0; i < 5; i++) {
      const particle = surpriseBurstParticles[i];
      if (!particle) continue;
      const distance = exitDistance * particle.distance * burst;
      const faceSize = (42 - (i % 2) * 5) * unit;
      push();
      translate(cos(particle.angle) * distance, sin(particle.angle) * distance);
      rotate(particle.rotation * burst * 0.3);
      stroke("#5b3a22");
      strokeWeight(2.3 * unit);
      fill("#ffd83d");
      circle(0, 0, faceSize);
      noStroke();
      fill("#5b3a22");
      ellipse(-faceSize * 0.18, -faceSize * 0.12, faceSize * 0.1, faceSize * 0.16);
      ellipse(faceSize * 0.18, -faceSize * 0.12, faceSize * 0.1, faceSize * 0.16);
      noFill();
      stroke("#5b3a22");
      strokeWeight(2.5 * unit);
      arc(0, faceSize * 0.06, faceSize * 0.47, faceSize * 0.36, 0, PI);
      pop();
    }
  } else if (type === "Plushies") {
    const hearts = [
      [44, "#ff5d88"], [37, "#a86bf5"], [50, "#ff8d4d"],
      [26, "#72cf9a"], [27, "#63bdf3"]
    ];
    noStroke();
    for (let i = 0; i < hearts.length; i++) {
      const [heartSize, heartColor] = hearts[i];
      const particle = surpriseBurstParticles[i];
      if (!particle) continue;
      const distance = exitDistance * particle.distance * burst;
      push();
      translate(cos(particle.angle) * distance, sin(particle.angle) * distance);
      rotate(particle.rotation * burst * 0.3);
      fill(heartColor);
      beginShape();
      vertex(0, heartSize * 0.42 * unit);
      bezierVertex(-heartSize * 1.05 * unit, -heartSize * 0.2 * unit, -heartSize * 0.52 * unit, -heartSize * 0.95 * unit, 0, -heartSize * 0.42 * unit);
      bezierVertex(heartSize * 0.52 * unit, -heartSize * 0.95 * unit, heartSize * 1.05 * unit, -heartSize * 0.2 * unit, 0, heartSize * 0.42 * unit);
      endShape(CLOSE);
      fill(255, 255, 255, 145);
      ellipse(-heartSize * 0.18 * unit, -heartSize * 0.3 * unit, heartSize * 0.26 * unit, heartSize * 0.16 * unit);
      pop();
    }
  }
  pop();
}
   
//air capacity increase
function blowAir() { 
  // if (state === "BURST" && ) {
  //   state = "DEFLATED";
  //   aircapacity = 0;
  //   targetBalloonSize = 50; // Set the size to 50px when deflated
  //   currentBalloonSize = targetBalloonSize; // Immediately set the size to deflated
  //   bgColor = [255, 255, 0]; // Reset background color to yellow
  // } else {
    if (!inflateSound.isPlaying()) {
      inflateSound.play();
    }
    aircapacity += 1;
    updateBalloonState();
  // }
}

function updateBalloonState() {
  if (aircapacity <= 0) {
    state = "DEFLATED";
    aircapacity = 0;
    targetBalloonSize = 150; // Set the size to 150px when deflated
    bgColor = [255, 255, 0]; // Reset background color to yellow
    gameplayTheme = "CIRCUS";
  }
  else if (aircapacity >= 25 && aircapacity <= 49) {
    state = "INFLATED";
  }
  else if (aircapacity >= 50 && aircapacity <= 74) {
    state = "OVER_INFLATED";
  }  
  else if (aircapacity >= 75 && aircapacity <= 99) {
    state = "VERY_OVER_INFLATED";
  }
  else if (aircapacity >= 100) {
    setBurst();
  }
  targetBalloonSize = 150 + balloonSize * aircapacity / 100 * 1.5; // Start inflating from 150px
}

function grabBalloon() {
  if (state === "INFLATED" || state === "OVER_INFLATED") {
    state = "TAKEN_AWAY";
  }
}

function setBurst() {
  if (state === "BURST") {
    return;
  }
  if (!burstCounted) {
    burstCounted = true;
    burstCount++;
  }
  surpriseRevealStartedAt = max(1, millis());
  burstLinesStartedAt = millis();
  state = "BURST";
}

// Match the double-stroked pop rays used by the drifting background balloons.
// This is drawn before the burst GIF so the artwork stays in front of the rays.
function drawGameplayBurstLines() {
  // A quick flash makes the rays feel like an instant pop rather than a
  // second animation competing with the burst GIF.
  const progress = constrain((millis() - burstLinesStartedAt) / 350, 0, 1);
  const radius = lerp(currentBalloonSize * 0.24, currentBalloonSize * 0.98, progress);
  const alpha = 255 * sq(1 - progress);
  const rayCount = 10;

  push();
  translate(balloonX, balloonY);
  strokeCap(ROUND);
  stroke(255, alpha);
  strokeWeight(max(4, currentBalloonSize * 0.045));
  for (let ray = 0; ray < rayCount; ray++) {
    const angle = ray * TWO_PI / rayCount + 0.18;
    line(cos(angle) * radius * 0.34, sin(angle) * radius * 0.34,
      cos(angle) * radius, sin(angle) * radius);
  }

  stroke(239, 93, 94, alpha);
  strokeWeight(max(2, currentBalloonSize * 0.018));
  for (let ray = 0; ray < rayCount; ray++) {
    const angle = ray * TWO_PI / rayCount + 0.18;
    line(cos(angle) * radius * 0.30, sin(angle) * radius * 0.30,
      cos(angle) * radius, sin(angle) * radius);
  }
  pop();
}

function dragNeedle() {
  const displayBalloonY = balloonY + getGameplayBalloonSway();
  if (!isTimeout && dist(mouseX, mouseY, balloonX, displayBalloonY) < (currentBalloonSize / 1.5) + 50) {
    if ((state == "INFLATED" || state === "OVER_INFLATED" || state === "VERY_OVER_INFLATED") && takingNeedle) {
      isNervous = true;
      // if top left of needle is inside balloon
      if (dist(mouseX, mouseY, balloonX, displayBalloonY) < (currentBalloonSize / 2)) {
        setBurst();
      }
    } else {
      isNervous = false;
    }
  } else {
    isNervous = false;
  }
}

function pokeNeedle() {
  if (state === "NERVOUS" || state === "VERY_OVER_INFLATED") {
    setBurst();
    // generateSurprise();
  }
}

function displayState() {
  switch (state) { 
    case "DEFLATED":
      image(deflatedImg, balloonX - currentBalloonSize / 2, balloonY - currentBalloonSize / 2, currentBalloonSize, currentBalloonSize);
      break;
    case "INFLATED":
      if (isNervous) {
        image(inflatedNervousImg, balloonX - currentBalloonSize / 2, balloonY - currentBalloonSize / 2, currentBalloonSize, currentBalloonSize);
        drawPupils();
      } else {
        image(inflatedImg, balloonX - currentBalloonSize / 2, balloonY - currentBalloonSize / 2, currentBalloonSize, currentBalloonSize);
      }
      break;
    case "OVER_INFLATED":
      if (isNervous) {
        image(overInflatedNervousImg, balloonX - currentBalloonSize / 2, balloonY - currentBalloonSize / 2, currentBalloonSize, currentBalloonSize);
        drawPupils(); // Add this line to draw pupils for OverInflatedNervous
      } else {
        image(overInflatedImg, balloonX - currentBalloonSize / 2, balloonY - currentBalloonSize / 2, currentBalloonSize, currentBalloonSize);
      }
      break;
    case "VERY_OVER_INFLATED":
      if (isNervous) {
        image(veryOverInflatedNervousImg, balloonX - currentBalloonSize / 2, balloonY - currentBalloonSize / 2, currentBalloonSize, currentBalloonSize);
        drawPupils(); // Add this line to draw pupils for VeryOverInflatedNervous
      } else {
        image(veryOverInflatedImg, balloonX - currentBalloonSize / 2, balloonY - currentBalloonSize / 2, currentBalloonSize, currentBalloonSize);
      }
      break;
    case "BURST":
      if (!surpriseGenerated) {
        surprise = getRandomSurprise();
        getsurpriseColor(surprise);
        if (!burstSound.isPlaying()) {
          burstSound.play();
        }
      }
      canPressB = false;

      drawGameplayBurstLines();
      drawSurprise(surprise, balloonX, balloonY, currentBalloonSize);
      
      if (!burstTimeout) {
        burstTimeout = true;
        setTimeout(() => {
          loadingBurst = false;
        }, 1300); // 2 seconds timeout
      }
      break;
    // case "TAKEN_AWAY":
    //   image(takenAwayImg, balloonX - currentBalloonSize / 2, balloonY - currentBalloonSize / 2, currentBalloonSize, currentBalloonSize);
    //   break;
  }
}

function drawPupils() {
  let pupilSize = currentBalloonSize * 0.08; // Default pupil size
  if (state === "VERY_OVER_INFLATED" && isNervous) {
    pupilSize = currentBalloonSize * 0.06; // Smaller pupil size for VeryOverInflatedNervous
  }
  if (state === "OVER_INFLATED" && isNervous) {
    pupilSize = currentBalloonSize * 0.07; // Smaller pupil size for VeryOverInflatedNervous
  }
  let eyeOffsetX = currentBalloonSize * 0.05; // Scale the eye offset based on balloon size
  let eyeOffsetY = currentBalloonSize * 0.05; // Scale the eye offset based on balloon size
  let eyeDistance = currentBalloonSize * 0.25; // Scale the eye distance based on balloon size

  // Calculate the direction vector from the balloon center to the mouse
  let dirX = mouseX - balloonX;
  let dirY = mouseY - balloonY;
  let mag = sqrt(dirX * dirX + dirY * dirY);

  // Normalize the direction vector
  dirX /= mag;
  dirY /= mag;

  // Calculate the pupil positions
  let leftPupilX = balloonX - eyeDistance / 2 + dirX * eyeOffsetX;
  let leftPupilY = balloonY + (dirY - 1) * eyeOffsetY;
  let rightPupilX = balloonX + eyeDistance / 2 + dirX * eyeOffsetX;
  let rightPupilY = balloonY + (dirY - 1) * eyeOffsetY;

  // Draw the pupils
  fill(36, 56, 84);
  noStroke();
  ellipse(leftPupilX, leftPupilY, pupilSize, pupilSize);
  ellipse(rightPupilX, rightPupilY, pupilSize, pupilSize);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Adjust canvas size when window is resized
  balloonX = width / 2;
  balloonY = height / 2;
}

function showEndScreen() {
  circusMusic.stop();
  drawGameplayBackground();
  const compact = width < 600 || height < 720;
  const scoreCard = getEndScreenScoreBounds();

  textFont(sourGummyFont);
  textAlign(CENTER, CENTER);
  fill(255, 247, 217);
  stroke(36, 56, 84);
  strokeWeight(6);
  textSize(compact ? 30 : 38);
  // Give each score-screen row room to breathe on both phone and desktop.
  text("YOUR SCORE:", width / 2, scoreCard.y - scoreCard.h / 2 - (compact ? 54 : 64));

  if (burstCount > highscore) {
    textSize(compact ? 22 : 28);
    text("NEW HIGHSCORE!", width / 2, scoreCard.y - scoreCard.h / 2 - (compact ? 92 : 108));
  }

  drawWoodScoreSign(scoreCard, compact);

  // Scale from the board itself so the score keeps the same proportion on
  // mobile and web. The web layout has extra room above the actions, so its
  // numeral sits noticeably higher on the sign.
  const scoreNumberSize = scoreCard.w * (144 / 270);
  const scoreNumberY = scoreCard.y - scoreCard.h * 0.12;
  fill(255, 248, 215);
  stroke(105, 58, 34);
  strokeWeight(compact ? 13 : 15);
  textSize(scoreNumberSize);
  text(burstCount, scoreCard.x, scoreNumberY);

  // Keep the best result visible as a separate, deliberately slim plaque
  // directly under the square score board. Include this round's score so a
  // new record is reflected immediately, before the player presses Retry.
  const highscoreCard = getEndScreenHighscoreBounds(scoreCard);
  drawHighscoreSign(highscoreCard, max(highscore, burstCount), compact);
  
  const homeButton = getEndScreenButtonBounds(0);
  const retryButton = getEndScreenButtonBounds(1);
  drawArcadeButton(homeButton, "HOME", false);
  drawArcadeButton(retryButton, "RETRY");
}

function mousePressed() {
  requestMotionPermission();

  if (isMuteButtonPressed()) {
    // A second press closes the control and mutes all audio. The next press
    // restores playback and shows the previously selected music volume.
    if (isVolumeControlOpen) {
      isMuted = true;
      isVolumeControlOpen = false;
      try {
        localStorage.setItem("boobooMuted", "true");
      } catch (error) {
        // Storage is optional for local previews.
      }
      applyMuteState();
    } else {
      isMuted = false;
      try {
        localStorage.setItem("boobooMuted", "false");
      } catch (error) {
        // Storage is optional for local previews.
      }
      applyMuteState();
      isVolumeControlOpen = true;
      lastVolumeInteraction = millis();
    }
    isAdjustingMusicVolume = false;
    return;
  }

  if (isVolumeSliderPressed()) {
    isAdjustingMusicVolume = true;
    setMusicVolumeFromPointer();
    return;
  }

  if (gameState === "HOME") {
    // Check if the play button is clicked
    const playButton = getHomePlayBounds();
    if (mouseX > playButton.x - playButton.w / 2 && mouseX < playButton.x + playButton.w / 2 && mouseY > playButton.y - playButton.h / 2 && mouseY < playButton.y + playButton.h / 2) {
      gameState = "COUNTDOWN"; // Change the game state to "COUNTDOWN" when the play button is clicked
      countdownTimer = 3; // Reset the countdown timer
      setTimeout(countdown, 1000); // Start the countdown
    }
  } else {
    const homeButton = getEndScreenButtonBounds(0);
    const retryButton = getEndScreenButtonBounds(1);
    if (isInsideButton(retryButton) && timer <= 0) {
      console.log("Retry button clicked");
      resetGame();
    }

    // Check if the "Return to home" button is clicked
    if (isInsideButton(homeButton) && timer <= 0) {
      gameState = "HOME"; // Immediately return to home screen
      resetGame(); // Reset the game variables
    }

    // // Check if the needle button is clicked
    // if (dist(mouseX, mouseY, balloonX - 30, balloonY + currentBalloonSize / 2 + 45) < 25) {
    //   pokeNeedle();
    // }

    if (gameState !== "COUNTDOWN" && !((timer <= 0 && !surpriseTimeout && !burstTimeout && loadingBurst))) {
      takeNeedle();
    }

    // Check if the party button is clicked
    // let scaledButtonSize = buttonSize * (width / 500); // Scale button size based on screen width
    // let maxButtonSize = 81; // Maximum button size for desktop
    // let finalButtonSize = min(scaledButtonSize, maxButtonSize); // Use the smaller size between scaled and max

    // if (mouseX > width / 2 - finalButtonSize / 2 - 30 - finalButtonSize / 2 && mouseX < width / 2 - finalButtonSize / 2 - 30 + finalButtonSize / 2 && mouseY > height - finalButtonSize / 2 - 80 - finalButtonSize / 2 && mouseY < height - finalButtonSize / 2 - 80 + finalButtonSize / 2) {
    //   partyMode();
    // }


  }
}

function countdown() {
  if (countdownTimer > 1) {
    countdownTimer--;
    setTimeout(countdown, 1000); // Continue the countdown
  } else if (countdownTimer === 1) {
    countdownTimer = "BLOW!";
    setTimeout(() => {
      gameState = "PLAY"; // Transition to the game state
      state = "DEFLATED"; // Set the initial state to deflated
      bgColor = [255, 255, 0]; // Set the initial background color to yellow
      gameplayTheme = "CIRCUS";
      lastTimerUpdate = millis();
      // Do not call resetGame here to avoid resetting gameState
    }, 1000);
  }
}

function resetGame() {
  if (burstCount > highscore) {
    highscore = burstCount;
  }
  burstCount = 0;
  timer = initialTimer; // Reset the timer to the full 30-second round
  lastTimerUpdate = millis();
  aircapacity = 0; // Reset air capacity
  state = "DEFLATED"; // Reset state to deflated
  targetBalloonSize = 150; // Reset balloon size
  currentBalloonSize = targetBalloonSize; // Immediately set the size to deflated
  bgColor = [255, 255, 0]; // Reset background color to yellow
  gameplayTheme = "CIRCUS";
  canPressB = true; // Re-enable key presses
  surpriseGenerated = false; // Reset surprise flag
  surpriseRevealStartedAt = 0;
  surpriseBurstParticles = [];
  loadingBurst = true; // Reset loading burst flag
  surpriseTimeout = false; // Reset surprise timeout flag
  burstTimeout = false; // Reset burst timeout flag
  loop(); // Restart the draw loop
}

// Add touch event handlers for mobile devices
function touchStarted() {
  mousePressed();
  return false; // Prevent the follow-up browser click from toggling controls twice.
}

function touchEnded() {
  isAdjustingMusicVolume = false;
  releaseNeedle();
}

function mouseReleased() {
  isAdjustingMusicVolume = false;
  releaseNeedle();
}

function mouseDragged() {
  if (isAdjustingMusicVolume) {
    setMusicVolumeFromPointer();
    return false;
  }
}

function touchMoved() {
  if (isAdjustingMusicVolume) {
    setMusicVolumeFromPointer();
    return false;
  }
}

function releaseNeedle() {
  takingNeedle = false;
}

function takeNeedle() {
  if (isNeedleButtonPressed()) {
    takingNeedle = true;
  }
}

function getNeedleButtonBounds() {
  const scaledButtonSize = buttonSize * (width / 500);
  const size = min(scaledButtonSize, 81);
  return {
    x: width / 2,
    // Leave extra room above the microphone meter on web layouts.
    y: height - size / 2 - 160,
    size
  };
}

function drawNeedleButtonFrame(button) {
  const compact = width < 600;
  const frameSize = button.size + (compact ? 20 : 26);
  const corner = compact ? 15 : 18;

  push();
  rectMode(CENTER);
  // Repeat the stacked wood treatment used by the score signs, scaled down
  // into a durable-looking frame for the needle tool.
  noStroke();
  fill(105, 58, 34, 210);
  rect(button.x + 3, button.y + 5, frameSize, frameSize, corner);
  fill(151, 85, 43);
  rect(button.x, button.y, frameSize, frameSize, corner);
  fill(194, 119, 57);
  rect(button.x, button.y - frameSize * 0.025, frameSize * 0.92, frameSize * 0.91, corner - 2);
  fill(239, 166, 85, 145);
  rect(button.x - frameSize * 0.035, button.y - frameSize * 0.37, frameSize * 0.71, max(2, frameSize * 0.045), 4);

  stroke(132, 76, 39, 100);
  strokeWeight(max(1.25, frameSize * 0.018));
  line(button.x - frameSize * 0.34, button.y + frameSize * 0.19, button.x - frameSize * 0.07, button.y + frameSize * 0.21);
  line(button.x + frameSize * 0.08, button.y - frameSize * 0.18, button.x + frameSize * 0.35, button.y - frameSize * 0.16);

  // The pale inset makes the icon legible while the wood remains visible as
  // a frame on all sides.
  noStroke();
  fill(255);
  rect(button.x, button.y, button.size + (compact ? 2 : 4), button.size + (compact ? 2 : 4), compact ? 11 : 13);
  pop();
}

function isNeedleButtonPressed() {
  const button = getNeedleButtonBounds();

  return mouseX > button.x - button.size / 2 &&
    mouseX < button.x + button.size / 2 &&
    mouseY > button.y - button.size / 2 &&
    mouseY < button.y + button.size / 2;
}

function getHomePlayBounds() {
  const compact = width < 600 || height < 720;
  return {
    x: width / 2,
    y: compact ? height * 0.84 : height * 0.87,
    w: min(width * 0.74, 270),
    h: compact ? 54 : 62
  };
}

function getEndScreenButtonBounds(index) {
  const compact = width < 600 || height < 720;
  const buttonHeight = compact ? 54 : 62;
  const gap = compact ? 12 : 16;
  // Home sits on the left; the primary Retry action is on the right.
  const actionWidth = min(width * (compact ? 0.40 : 0.34), compact ? 150 : 180);
  const groupWidth = actionWidth * 2 + gap;
  const scoreCard = getEndScreenScoreBounds();
  const highscoreCard = getEndScreenHighscoreBounds(scoreCard);
  // Keep the action row clearly separated from the high-score plaque.
  const y = highscoreCard.y + highscoreCard.h / 2 + (compact ? 70 : 78);

  // Center the two equal actions as one row.
  if (index === 0) {
    return {
      x: width / 2 - groupWidth / 2 + actionWidth / 2,
      y,
      w: actionWidth,
      h: buttonHeight
    };
  }

  return {
    x: width / 2 + groupWidth / 2 - actionWidth / 2,
    y,
    w: actionWidth,
    h: buttonHeight
  };
}

function getEndScreenScoreBounds() {
  const compact = width < 600 || height < 720;
  const scoreSize = min(width * 0.74, 270);
  return {
    x: width / 2,
    y: compact ? height * 0.40 : height * 0.43,
    w: scoreSize,
    h: scoreSize
  };
}

function getEndScreenHighscoreBounds(scoreCard) {
  const compact = width < 600 || height < 720;
  const h = compact ? 42 : 48;
  const gap = compact ? 22 : 26;
  return {
    x: scoreCard.x,
    y: scoreCard.y + scoreCard.h / 2 + gap + h / 2,
    w: scoreCard.w * 0.94,
    h
  };
}

function drawHighscoreSign(highscoreCard, score, compact) {
  const { x, y, w, h } = highscoreCard;
  const corner = compact ? 11 : 13;

  push();
  rectMode(CENTER);
  noStroke();
  // The shallow wood treatment makes this read as part of the score board
  // while keeping its long, skinny silhouette distinct from the main square.
  fill(105, 58, 34, 210);
  rect(x + 3, y + 4, w, h, corner);
  fill(151, 85, 43);
  rect(x, y, w, h, corner);
  fill(194, 119, 57);
  rect(x, y - h * 0.035, w * 0.96, h * 0.82, corner - 2);
  fill(239, 166, 85, 125);
  rect(x - w * 0.08, y - h * 0.25, w * 0.70, max(2, h * 0.08), 3);

  fill(255, 248, 215);
  stroke(105, 58, 34);
  strokeWeight(compact ? 4 : 5);
  textAlign(CENTER, CENTER);
  textSize(compact ? 23 : 27);
  text("HIGHSCORE: " + score, x, y - h * 0.05);
  pop();
}

function drawWoodScoreSign(scoreCard, compact) {
  const corner = compact ? 14 : 18;
  const { x, y, w, h } = scoreCard;

  push();
  rectMode(CENTER);
  noStroke();
  // Layered brown faces, a soft shadow, and grain match the game's other
  // wooden signboards while keeping the score easy to read.
  fill(105, 58, 34, 210);
  rect(x + 5, y + 7, w, h, corner);
  fill(151, 85, 43);
  rect(x, y, w, h, corner);
  fill(194, 119, 57);
  rect(x, y - h * 0.025, w * 0.95, h * 0.92, corner - 2);
  fill(239, 166, 85, 150);
  rect(x - w * 0.03, y - h * 0.39, w * 0.79, max(2, h * 0.045), 4);

  stroke(132, 76, 39, 100);
  strokeWeight(max(1.5, h * 0.018));
  for (let grain = -2; grain <= 2; grain++) {
    const grainY = y + grain * h * 0.15;
    line(x - w * 0.39, grainY, x - w * 0.09, grainY + grain * 2);
    line(x + w * 0.07, grainY - grain, x + w * 0.39, grainY + grain * 1.5);
  }

  // Match the hanging board's dark metal fixtures at each scoreboard corner.
  // A small pale spot makes every nail feel rounded instead of flat.
  noStroke();
  const nailInsetX = w * 0.405;
  const nailInsetY = h * 0.405;
  const nailSize = compact ? 12 : 14;
  for (const nailX of [x - nailInsetX, x + nailInsetX]) {
    for (const nailY of [y - nailInsetY, y + nailInsetY]) {
      fill(71, 81, 88);
      ellipse(nailX, nailY, nailSize, nailSize);
      fill(211, 220, 222);
      ellipse(nailX - nailSize * 0.14, nailY - nailSize * 0.14, nailSize * 0.36, nailSize * 0.36);
    }
  }
  pop();
}

function isInsideButton(button) {
  return mouseX > button.x - button.w / 2 && mouseX < button.x + button.w / 2 &&
    mouseY > button.y - button.h / 2 && mouseY < button.y + button.h / 2;
}

// Shared with Play so primary actions have the same chunky red face, navy
// outline, cream lettering, and small pressed-looking shadow.
function drawArcadeButton(button, label, isPrimary = true) {
  const compact = width < 600 || height < 720;
  rectMode(CENTER);
  noStroke();
  fill(36, 56, 84);
  rect(button.x, button.y + 5, button.w, button.h, 14);
  if (isPrimary) {
    fill(isInsideButton(button) ? color(255, 119, 112) : color(239, 93, 94));
  } else {
    fill(isInsideButton(button) ? color(238, 233, 222) : color(246, 241, 230));
  }
  stroke(36, 56, 84);
  strokeWeight(4);
  rect(button.x, button.y, button.w, button.h, 14);
  fill(255, 247, 217);
  stroke(36, 56, 84);
  strokeWeight(6);
  textSize(compact ? 30 : 35);
  textAlign(CENTER, CENTER);
  text(label, button.x, button.y - 6);
}

function drawHomeCloud(x, y, cloudScale, opacity) {
  noStroke();
  fill(255, 250, 224, opacity);
  ellipse(x, y, 44 * cloudScale, 26 * cloudScale);
  ellipse(x + 25 * cloudScale, y - 10 * cloudScale, 38 * cloudScale, 34 * cloudScale);
  ellipse(x + 53 * cloudScale, y, 53 * cloudScale, 27 * cloudScale);
  rect(x - 22 * cloudScale, y, 99 * cloudScale, 14 * cloudScale, 8 * cloudScale);
}

function drawHomeStar(x, y, starSize, starColor) {
  push();
  translate(x, y);
  noStroke();
  fill(starColor);
  rectMode(CENTER);
  rect(0, 0, starSize, starSize * 0.3, 2);
  rect(0, 0, starSize * 0.3, starSize, 2);
  pop();
}

function drawHomeFlower(x, y, flowerScale, petalColor, swayPhase = 0) {
  push();
  // Pivot at the base of the stem so every flower gently sways in the breeze.
  translate(x, y + 25 * flowerScale);
  rotate(sin(millis() / 1286 + swayPhase) * 0.12);
  translate(0, -25 * flowerScale);
  noStroke();
  fill(56, 139, 92);
  rectMode(CENTER);
  rect(0, 8 * flowerScale, 3 * flowerScale, 17 * flowerScale, 2);
  fill(76, 163, 99);
  ellipse(-4 * flowerScale, 10 * flowerScale, 9 * flowerScale, 5 * flowerScale);
  ellipse(4 * flowerScale, 14 * flowerScale, 9 * flowerScale, 5 * flowerScale);
  fill(petalColor);
  ellipse(0, -5 * flowerScale, 10 * flowerScale, 10 * flowerScale);
  ellipse(6 * flowerScale, 0, 10 * flowerScale, 10 * flowerScale);
  ellipse(0, 5 * flowerScale, 10 * flowerScale, 10 * flowerScale);
  ellipse(-6 * flowerScale, 0, 10 * flowerScale, 10 * flowerScale);
  fill(255, 215, 87);
  ellipse(0, 0, 8 * flowerScale, 8 * flowerScale);
  pop();
}

function drawWoodArrowPanel(x, y, panelW, panelH, direction, label, lines, accentColor) {
  const tipW = min(panelW * 0.12, panelH * 0.72);
  const notchW = tipW * 0.35;
  const shadowY = max(3, panelH * 0.09);

  function arrowShape(yOffset) {
    beginShape();
    if (direction === "right") {
      vertex(x - panelW / 2, y - panelH / 2 + yOffset);
      vertex(x + panelW / 2 - tipW, y - panelH / 2 + yOffset);
      vertex(x + panelW / 2, y + yOffset);
      vertex(x + panelW / 2 - tipW, y + panelH / 2 + yOffset);
      vertex(x - panelW / 2, y + panelH / 2 + yOffset);
      vertex(x - panelW / 2 + notchW, y + yOffset);
    } else {
      vertex(x - panelW / 2 + tipW, y - panelH / 2 + yOffset);
      vertex(x + panelW / 2, y - panelH / 2 + yOffset);
      vertex(x + panelW / 2 - notchW, y + yOffset);
      vertex(x + panelW / 2, y + panelH / 2 + yOffset);
      vertex(x - panelW / 2 + tipW, y + panelH / 2 + yOffset);
      vertex(x - panelW / 2, y + yOffset);
    }
    endShape(CLOSE);
  }

  noStroke();
  fill(105, 58, 34);
  arrowShape(shadowY);
  fill(194, 119, 57);
  arrowShape(0);

  // A highlight and a few restrained grain marks give the flat canvas shape
  // enough of a hand-painted wooden feel without needing another image asset.
  stroke(239, 166, 85, 150);
  strokeWeight(max(1, panelH * 0.035));
  line(x - panelW * 0.34, y - panelH * 0.31, x + panelW * 0.29, y - panelH * 0.31);
  stroke(132, 76, 39, 90);
  strokeWeight(max(1, panelH * 0.022));
  for (let grain = -1; grain <= 1; grain++) {
    const grainY = y + grain * panelH * 0.20;
    line(x - panelW * 0.27, grainY, x - panelW * 0.10, grainY + grain * 1.5);
    line(x + panelW * 0.09, grainY - grain, x + panelW * 0.27, grainY);
  }

  noStroke();
  textFont(sourGummyFont);
  textAlign(CENTER, CENTER);
  if (lines.length === 0) {
    fill(255, 248, 215);
    textSize(panelH * 0.46);
    text(label, x, y - panelH * 0.04);
    return;
  }

  const numberX = x - panelW * 0.34;
  fill(accentColor);
  stroke(105, 58, 34);
  // Keep the numbered badge outline slightly lighter than its lettering.
  strokeWeight(panelH * 0.05 + 0.4);
  ellipse(numberX, y, panelH * 0.48, panelH * 0.48);

  // Match the outlined numerals on the scoreboard so the instruction signs
  // read as part of the same wooden UI.
  stroke(105, 58, 34);
  strokeWeight(panelH * 0.05 + 1.4);
  fill(255, 248, 215);
  textSize(panelH * 0.32);
  text(label, numberX, y - panelH * 0.035);

  const textX = numberX + panelH * 0.38;
  fill(255, 248, 215);
  textAlign(LEFT, CENTER);
  let instructionSize = panelH * 0.34;
  const maxTextWidth = x + panelW * 0.40 - textX;
  textSize(instructionSize);
  while (instructionSize > 10 && max(lines.map(line => textWidth(line))) > maxTextWidth) {
    instructionSize -= 0.5;
    textSize(instructionSize);
  }
  const lineHeight = instructionSize * 0.82;
  const firstLineY = y - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], textX, firstLineY + i * lineHeight);
  }
}

function getWoodArrowPanelWidth(panelH, lines) {
  // Size the board from the instruction at its intended type size. This keeps
  // the hand-painted signs snug on wide web layouts instead of giving every
  // label the same, oversized board.
  textFont(sourGummyFont);
  textSize(panelH * 0.34);
  const instructionW = max(lines.map(line => textWidth(line)));
  const numberAndGapW = panelH * 0.38;
  const rightPadding = panelH * 0.14;
  // The text starts at -34% of the board width and ends before +40%.
  const textAreaRatio = 0.74;
  return max(panelH * 1.8, (instructionW + numberAndGapW + rightPadding) / textAreaRatio);
}

function drawInstructionSignpost(centerX, topY, bottomY, verticalOffsetY = 0) {
  const panels = [
    { direction: "left", width: 1.00, label: "1", lines: ["Blow your mic", "to inflate Booboo"], accent: color(239, 93, 94) },
    { direction: "right", width: 0.94, label: "2", lines: ["Needles can", "pop Booboo"], accent: color(73, 151, 182) },
    { direction: "left", width: 0.98, label: "3", lines: ["Pop as many", "as you can!"], accent: color(246, 190, 82) }
  ];

  // The signpost has one master layout. Phones scale this exact drawing down
  // as a unit, so arrow shape, spacing, post thickness, and lettering retain
  // the same proportions as the web version.
  const basePanelH = 58;
  const basePanelGap = 16;
  const basePanelW = 420;
  const basePostW = 32;
  const baseTotalH = basePanelH * 3 + basePanelGap * 2;
  const fittedWidths = panels.map(panel => min(
    basePanelW * panel.width,
    getWoodArrowPanelWidth(basePanelH, panel.lines)
  ));
  const baseSignW = max(fittedWidths);
  const widthScale = (width - 20) / baseSignW;
  const heightScale = max(0.586, (bottomY - topY) / baseTotalH);
  // Enlarge the complete signboard by 1.2× on mobile while leaving the
  // desktop layout at its existing scale.
  const mobileSignScale = width < 600 || height < 720 ? 1.2 : 1;
  const signScale = min(1, widthScale, heightScale) * mobileSignScale;
  const postTop = -basePanelH * 0.32;
  const postBottom = baseTotalH + basePanelH * 0.55;
  const postY = (postTop + postBottom) / 2;
  const postH = postBottom - postTop;

  push();
  translate(centerX, topY + verticalOffsetY);
  scale(signScale);
  rectMode(CENTER);
  noStroke();
  fill(91, 50, 31);
  rect(4, postY + 5, basePostW, postH, 4);
  fill(160, 92, 45);
  rect(0, postY, basePostW, postH, 4);
  fill(218, 137, 68, 135);
  rect(-basePostW * 0.20, postY, basePostW * 0.22, postH * 0.94, 3);

  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];
    const fittedPanelW = fittedWidths[i];
    const directionOffset = (panel.direction === "right" ? 1 : -1) * fittedPanelW * 0.025;
    const panelX = directionOffset;
    const panelY = basePanelH / 2 + i * (basePanelH + basePanelGap);
    const panelAngle = radians(i % 2 === 0 ? -2 : 2);
    push();
    translate(panelX, panelY);
    rotate(panelAngle);
    drawWoodArrowPanel(
      0,
      0,
      fittedPanelW,
      basePanelH,
      panel.direction,
      panel.label,
      panel.lines,
      panel.accent
    );
    pop();
  }

  // A small clump at the foot of the post anchors the sign in the meadow and
  // hides its otherwise abrupt lower edge.
  const grassBaseY = postBottom - 2;
  noStroke();
  fill(104, 187, 102);
  beginShape();
  vertex(-basePostW * 1.18, grassBaseY + 10);
  bezierVertex(
    -basePostW * 0.78, grassBaseY - 5,
    basePostW * 0.78, grassBaseY - 5,
    basePostW * 1.18, grassBaseY + 10
  );
  vertex(basePostW * 1.18, grassBaseY + 12);
  vertex(-basePostW * 1.18, grassBaseY + 12);
  endShape(CLOSE);
  stroke(48, 126, 65);
  strokeWeight(3);
  strokeCap(ROUND);
  const grassBlades = [
    [-25, 10, -31, -4], [-18, 11, -20, -8], [-11, 12, -5, -5],
    [-4, 12, -9, -11], [3, 12, 8, -7], [10, 11, 18, -5],
    [17, 10, 27, -2], [24, 9, 31, 1]
  ];
  for (const blade of grassBlades) {
    line(blade[0], grassBaseY + blade[1], blade[2], grassBaseY + blade[3]);
  }
  strokeCap(PROJECT);
  pop();
}

function drawMovingHomeClouds(compact) {
  // Start the clouds across the sky, then let each one drift and wrap.
  const cloudData = [
    { y: 0.22, scale: compact ? 0.75 : 1.05, speed: 0.012, start: 0.04, opacity: 220 },
    { y: 0.31, scale: compact ? 0.55 : 0.8, speed: 0.018, start: 0.31, opacity: 165 },
    { y: 0.43, scale: compact ? 0.46 : 0.65, speed: 0.009, start: 0.58, opacity: 125 },
    { y: 0.12, scale: compact ? 0.45 : 0.62, speed: 0.015, start: 0.82, opacity: 190 }
  ];
  for (const cloud of cloudData) {
    const cloudScale = cloud.scale * 2.2;
    const loopProgress = (cloud.start + millis() * cloud.speed / width) % 1;
    // Travel fully beyond both edges before wrapping, so a cloud never
    // visibly cuts off when its animation restarts.
    const x = lerp(-77 * cloudScale, width + 22 * cloudScale, loopProgress);
    drawHomeCloud(x, height * cloud.y, cloudScale, cloud.opacity);
  }
}

function drawFlyingBalloonSilhouettes(compact) {
  // Each balloon uses a time offset so the sky stays populated throughout the loop.
  const balloons = [
    { x: 0.09, size: 0.60, speed: 0.000035, offset: 0.18, color: [255, 151, 160], burstAt: 0.82 },
    { x: 0.28, size: 0.44, speed: 0.000045, offset: 0.67, color: [255, 224, 112], burstAt: 0.34 },
    { x: 0.71, size: 0.54, speed: 0.000032, offset: 0.39, color: [194, 150, 237], burstAt: 0.80 },
    { x: 0.91, size: 0.38, speed: 0.000050, offset: 0.87, color: [255, 151, 160], burstAt: 0.84 },
    { x: 0.48, size: 0.34, speed: 0.000040, offset: 0.04, color: [255, 224, 112], burstAt: 0.88 },
    { x: 0.18, size: 0.40, speed: 0.000043, offset: 0.52, color: [33, 128, 211], burstAt: 0.79 },
    { x: 0.58, size: 0.46, speed: 0.000037, offset: 0.81, color: [38, 161, 87], burstAt: 0.40 },
    { x: 0.82, size: 0.32, speed: 0.000052, offset: 0.24, color: [255, 177, 101], burstAt: 0.81 },
    { x: 0.38, size: 0.29, speed: 0.000047, offset: 0.94, color: [244, 130, 190], burstAt: 0.87 },
    { x: 0.04, size: 0.37, speed: 0.000041, offset: 0.43, color: [38, 161, 87], burstAt: 0.83 },
    { x: 0.23, size: 0.31, speed: 0.000054, offset: 0.08, color: [255, 177, 101], burstAt: 0.89 },
    { x: 0.34, size: 0.42, speed: 0.000034, offset: 0.56, color: [33, 128, 211], burstAt: 0.78 },
    { x: 0.53, size: 0.36, speed: 0.000049, offset: 0.29, color: [244, 130, 190], burstAt: 0.28 },
    { x: 0.66, size: 0.28, speed: 0.000055, offset: 0.73, color: [255, 224, 112], burstAt: 0.82 },
    { x: 0.77, size: 0.43, speed: 0.000038, offset: 0.12, color: [255, 151, 160], burstAt: 0.88 },
    { x: 0.97, size: 0.30, speed: 0.000051, offset: 0.61, color: [194, 150, 237], burstAt: 0.80 },
    { x: 0.12, size: 0.33, speed: 0.000046, offset: 0.35, color: [255, 177, 101], burstAt: 0.31 },
    { x: 0.25, size: 0.39, speed: 0.000036, offset: 0.76, color: [33, 128, 211], burstAt: 0.84 },
    { x: 0.44, size: 0.27, speed: 0.000056, offset: 0.16, color: [38, 161, 87], burstAt: 0.39 },
    { x: 0.62, size: 0.41, speed: 0.000039, offset: 0.68, color: [255, 151, 160], burstAt: 0.87 },
    { x: 0.74, size: 0.35, speed: 0.000048, offset: 0.47, color: [255, 224, 112], burstAt: 0.29 },
    { x: 0.87, size: 0.43, speed: 0.000033, offset: 0.91, color: [194, 150, 237], burstAt: 0.82 },
    { x: 0.51, size: 0.30, speed: 0.000053, offset: 0.22, color: [244, 130, 190], burstAt: 0.43 },
    { x: 0.03, size: 0.28, speed: 0.000050, offset: 0.84, color: [33, 128, 211], burstAt: 0.88 }
  ];

  for (const balloon of balloons) {
    const scale = balloon.size * 1.2 * (compact ? 0.78 : 1);
    const balloonW = 42 * scale;
    const balloonH = 54 * scale;
    const loopProgress = (balloon.offset + millis() * balloon.speed) % 1;
    // Include room for the balloon and its string outside the canvas on both
    // ends, so the loop restarts while the balloon is out of view.
    const y = lerp(height + balloonH * 1.2, -balloonH * 1.2, loopProgress);
    const sway = sin(millis() / 700 + balloon.offset * TWO_PI) * (compact ? 7 : 11);
    const x = balloon.x * width + sway;

    // A few balloons pop partway through their trip, then stay gone until
    // their next loop begins at the bottom of the screen.
    if (balloon.burstAt && loopProgress >= balloon.burstAt) {
      const burstProgress = (loopProgress - balloon.burstAt) / 0.075;
      if (burstProgress < 1) {
        push();
        translate(x, y);
        const burstRadius = lerp(balloonW * 0.25, balloonW * 1.35, burstProgress);
        const burstAlpha = 255 * (1 - burstProgress * 0.7);
        // A pale outer line and saturated inner line keep pops readable over
        // both the blue sky and white clouds.
        stroke(255, burstAlpha);
        strokeWeight(max(3, scale * 5));
        for (let ray = 0; ray < 10; ray++) {
          const angle = ray * TWO_PI / 10 + balloon.offset;
          line(cos(angle) * burstRadius * 0.35, sin(angle) * burstRadius * 0.35,
            cos(angle) * burstRadius, sin(angle) * burstRadius);
        }
        stroke(...balloon.color, burstAlpha);
        strokeWeight(max(1.5, scale * 2.2));
        for (let ray = 0; ray < 10; ray++) {
          const angle = ray * TWO_PI / 10 + balloon.offset;
          line(cos(angle) * burstRadius * 0.30, sin(angle) * burstRadius * 0.30,
            cos(angle) * burstRadius, sin(angle) * burstRadius);
        }
        noStroke();
        fill(...balloon.color, burstAlpha);
        circle(0, 0, max(2, balloonW * 0.22 * (1 - burstProgress)));
        pop();
      }
      continue;
    }

    drawBalloonSilhouette(x, y, balloonW, balloonH, balloon.color, 220, true);
  }
}

// Shared by the drifting background balloons and the scoreboard so both use
// exactly the same rounded balloon, knot, and curling-string silhouette.
function drawBalloonSilhouette(x, y, balloonW, balloonH, balloonColor, opacity = 220, showString = true) {
  push();
  translate(x, y);
  noStroke();
  fill(...balloonColor, opacity);
  beginShape();
  vertex(0, -balloonH / 2);
  bezierVertex(balloonW * 0.62, -balloonH / 2, balloonW * 0.62, balloonH * 0.12, 0, balloonH * 0.42);
  bezierVertex(-balloonW * 0.62, balloonH * 0.12, -balloonW * 0.62, -balloonH / 2, 0, -balloonH / 2);
  endShape(CLOSE);
  triangle(-balloonW * 0.12, balloonH * 0.33, balloonW * 0.12, balloonH * 0.33, 0, balloonH * 0.53);

  if (showString) {
    stroke(...balloonColor, opacity * 0.84);
    strokeWeight(max(1, balloonW / 28));
    noFill();
    bezier(0, balloonH * 0.50, -balloonW * 0.15, balloonH * 0.74, balloonW * 0.18, balloonH * 0.86, 0, balloonH * 1.12);
  }
  pop();
}

function drawHomeWorm(playButton, compact) {
  // Keep this little crawler tucked just below Play, where it can wander
  // without covering either the button or the instructions.
  const wormY = min(height - (compact ? 18 : 24), playButton.y + playButton.h / 2 + (compact ? 28 : 34));
  // Travel left-to-right, then turn and travel back at an unhurried pace.
  // The triangular progress makes each end a clear, repeatable turnaround.
  // 13.33 seconds per round trip is 40% slower than the previous 8 seconds.
  const travelPhase = (millis() % 13333) / 6666.5;
  const movingRight = travelPhase < 1;
  const travelProgress = movingRight ? travelPhase : 2 - travelPhase;
  const travelRange = min(width * 0.27, compact ? 105 : 155);
  const crawl = lerp(-travelRange, travelRange, travelProgress);
  const wiggle = sin(millis() / 110) * (compact ? 2 : 3);
  const segmentSize = compact ? 13 : 16;

  push();
  translate(width / 2 + crawl, wormY);
  // Mirror the drawing at either end so its face always leads its body.
  if (!movingRight) scale(-1, 1);

  // A wiggling chain of light-green segments makes the movement readable at
  // a glance, even on a small phone screen.
  noStroke();
  for (let i = 0; i < 4; i++) {
    const x = -i * segmentSize * 0.72;
    const y = sin(millis() / 110 + i * 0.8) * wiggle;
    fill(i === 0 ? color(191, 232, 153) : color(159, 211, 120));
    ellipse(x, y, segmentSize, segmentSize * 0.82);
  }

  // Give the leading segment two waving antennae and lively googly eyes.
  fill(205, 241, 170);
  ellipse(0, 0, segmentSize * 1.12, segmentSize);
  stroke(36, 56, 84);
  strokeWeight(compact ? 1.5 : 2);
  line(-3, -segmentSize * 0.35, -6, -segmentSize * 0.7 - wiggle);
  line(3, -segmentSize * 0.35, 7, -segmentSize * 0.7 + wiggle);
  noStroke();
  fill(255);
  ellipse(-2, -2, compact ? 5 : 7, compact ? 6 : 8);
  ellipse(5, -1, compact ? 5 : 7, compact ? 6 : 8);
  const googleWiggle = sin(millis() / 75) * (compact ? 0.8 : 1.2);
  fill(36, 56, 84);
  ellipse(-2 + googleWiggle, -2 + googleWiggle * 0.45, compact ? 2.5 : 3.5, compact ? 3 : 4);
  ellipse(5 + googleWiggle * 0.55, -1 - googleWiggle * 0.4, compact ? 2.5 : 3.5, compact ? 3 : 4);
  pop();
}

function drawMeadowSnail(compact) {
  // A long, one-way loop lets the snail leave the canvas before returning,
  // rather than visibly turning around at either edge.
  const snailSize = compact ? 28 : 36;
  const loopDuration = 30000;
  const loopProgress = (millis() % loopDuration) / loopDuration;
  const snailX = lerp(-snailSize * 2, width + snailSize * 2, loopProgress);
  // Keep the snail above the densest flowers so its little face is easy to see.
  const snailY = height * (compact ? 0.84 : 0.83) + sin(millis() / 500) * 1.5;
  const footWiggle = sin(millis() / 190) * (compact ? 1 : 1.5);

  push();
  translate(snailX, snailY);

  // Its soft shadow keeps the small character grounded in the grass.
  noStroke();
  fill(47, 113, 60, 75);
  ellipse(-snailSize * 0.04, snailSize * 0.26, snailSize * 1.45, snailSize * 0.24);

  // The body and raised head are deliberately light so the orange shell is
  // the focal point, while the little foot wiggle makes its slow crawl clear.
  fill(185, 211, 105);
  ellipse(-snailSize * 0.12, footWiggle * 0.25, snailSize * 1.42, snailSize * 0.50);
  ellipse(snailSize * 0.48, -snailSize * 0.13, snailSize * 0.56, snailSize * 0.60);

  // Orange shell with a warm rim and a simple spiral.
  fill(213, 102, 35);
  ellipse(-snailSize * 0.28, -snailSize * 0.20, snailSize * 0.94, snailSize * 0.94);
  fill(245, 143, 50);
  ellipse(-snailSize * 0.33, -snailSize * 0.27, snailSize * 0.76, snailSize * 0.76);
  noFill();
  stroke(163, 69, 30);
  strokeWeight(compact ? 1.8 : 2.3);
  arc(-snailSize * 0.33, -snailSize * 0.27, snailSize * 0.48, snailSize * 0.48, -HALF_PI, TWO_PI * 0.82);
  arc(-snailSize * 0.27, -snailSize * 0.24, snailSize * 0.23, snailSize * 0.23, -HALF_PI, TWO_PI * 0.92);

  // Friendly antennae and eyes lead the snail in its direction of travel.
  stroke(83, 116, 57);
  strokeWeight(compact ? 1.5 : 2);
  line(snailSize * 0.58, -snailSize * 0.37, snailSize * 0.72, -snailSize * 0.70 + footWiggle);
  line(snailSize * 0.74, -snailSize * 0.30, snailSize * 0.92, -snailSize * 0.58 - footWiggle);
  noStroke();
  // White eye whites with independently wiggling pupils give the snail the
  // same playful googly-eyed expression as the caterpillar.
  const leftEyeX = snailSize * 0.72;
  const leftEyeY = -snailSize * 0.70 + footWiggle;
  const rightEyeX = snailSize * 0.92;
  const rightEyeY = -snailSize * 0.58 - footWiggle;
  const eyeW = compact ? 6 : 8;
  const eyeH = compact ? 7 : 9;
  fill(255);
  ellipse(leftEyeX, leftEyeY, eyeW, eyeH);
  ellipse(rightEyeX, rightEyeY, eyeW, eyeH);
  const googleWiggle = sin(millis() / 75) * (compact ? 0.8 : 1.2);
  fill(36, 56, 84);
  ellipse(leftEyeX + googleWiggle, leftEyeY + googleWiggle * 0.45, compact ? 3 : 4, compact ? 3.5 : 4.5);
  ellipse(rightEyeX + googleWiggle * 0.55, rightEyeY - googleWiggle * 0.4, compact ? 3 : 4, compact ? 3.5 : 4.5);
  pop();
}

// Two tiny walkers make the lower meadow feel inhabited. They use separate
// looping paths so they do not bunch up or reverse abruptly at the edges.
function drawMeadowLadybug(compact) {
  const size = compact ? 15 : 20;
  const progress = (millis() % 22000) / 22000;
  const x = lerp(width + size * 2, -size * 2, progress);
  const y = height * (compact ? 0.775 : 0.79) + sin(millis() / 260) * 1.2;
  const step = sin(millis() / 85) * (compact ? 1.2 : 1.7);
  const walkBob = abs(sin(millis() / 85)) * (compact ? 1 : 1.5);

  push();
  translate(x, y - walkBob);
  // It travels left, so mirror its face toward the direction it is walking.
  scale(-1, 1);
  noStroke();
  fill(47, 113, 60, 65);
  ellipse(0, size * 0.42, size * 1.45, size * 0.22);
  fill(55, 53, 62);
  ellipse(size * 0.42, 0, size * 0.48, size * 0.50);
  fill(224, 68, 62);
  ellipse(-size * 0.12, 0, size * 1.08, size * 0.82);
  stroke(113, 38, 42);
  strokeWeight(compact ? 1.1 : 1.5);
  line(-size * 0.12, -size * 0.38, -size * 0.12, size * 0.38);
  noStroke();
  fill(50, 43, 52);
  circle(-size * 0.39, -size * 0.16, size * 0.16);
  circle(-size * 0.37, size * 0.19, size * 0.16);
  circle(size * 0.08, -size * 0.20, size * 0.14);
  // Match the meadow snail and worm's bright, wiggly googly eyes.
  const eyeW = compact ? 4.5 : 6;
  const eyeH = compact ? 5.5 : 7;
  const eyeWiggle = sin(millis() / 75) * (compact ? 0.55 : 0.8);
  fill(255);
  ellipse(size * 0.44, -size * 0.13, eyeW, eyeH);
  ellipse(size * 0.58, -size * 0.10, eyeW, eyeH);
  fill(36, 56, 84);
  ellipse(size * 0.44 + eyeWiggle, -size * 0.13 + eyeWiggle * 0.4, compact ? 2 : 2.7, compact ? 2.4 : 3.2);
  ellipse(size * 0.58 + eyeWiggle * 0.55, -size * 0.10 - eyeWiggle * 0.35, compact ? 2 : 2.7, compact ? 2.4 : 3.2);
  // Alternating feet give an otherwise small shape a clear walking rhythm.
  stroke(55, 53, 62);
  strokeWeight(compact ? 1 : 1.4);
  for (let i = 0; i < 3; i++) {
    const legX = -size * 0.36 + i * size * 0.27;
    const legLift = i % 2 === 0 ? step : -step;
    line(legX, size * 0.27, legX - size * 0.18, size * 0.46 + legLift * 0.18);
  }
  pop();
}

function drawNatureBackground() {
  const compact = width < 600 || height < 720;
  // Menus use centered rectangles for buttons. Reset the backdrop's own
  // coordinate mode so a retry cannot offset the sky's gradient bands.
  rectMode(CORNER);
  imageMode(CORNER);
  // Pixel-art sky and a flower-filled grass field create a cheerful arcade world.
  drawHomeSky();
  drawFlyingBalloonSilhouettes(compact);
  drawMovingHomeClouds(compact);
  noStroke();
  // On phones, scale the full hill composition uniformly and crop its sides.
  // This keeps the web-view silhouette instead of stretching hills taller.
  const grassEdgeY = height * 0.74;
  const hillUnit = width;

  // Back, middle, and front hills each have a subtly uneven crest.
  push();
  if (compact) {
    translate(width * 0.2, grassEdgeY);
    scale(2.6);
    translate(-width / 2, -grassEdgeY);
  }
  fill(132, 198, 111);
  beginShape();
  vertex(0, grassEdgeY);
  bezierVertex(width * 0.07, grassEdgeY - hillUnit * 0.17, width * 0.16, grassEdgeY - hillUnit * 0.26, width * 0.28, grassEdgeY - hillUnit * 0.20);
  bezierVertex(width * 0.35, grassEdgeY - hillUnit * 0.16, width * 0.39, grassEdgeY - hillUnit * 0.07, width * 0.47, grassEdgeY - hillUnit * 0.11);
  bezierVertex(width * 0.58, grassEdgeY - hillUnit * 0.16, width * 0.61, grassEdgeY - hillUnit * 0.31, width * 0.72, grassEdgeY - hillUnit * 0.26);
  bezierVertex(width * 0.83, grassEdgeY - hillUnit * 0.21, width * 0.89, grassEdgeY - hillUnit * 0.08, width, grassEdgeY - hillUnit * 0.14);
  vertex(width, grassEdgeY);
  endShape(CLOSE);
  fill(93, 174, 91);
  beginShape();
  vertex(0, grassEdgeY);
  bezierVertex(width * 0.08, grassEdgeY - hillUnit * 0.10, width * 0.19, grassEdgeY - hillUnit * 0.19, width * 0.30, grassEdgeY - hillUnit * 0.15);
  bezierVertex(width * 0.39, grassEdgeY - hillUnit * 0.12, width * 0.42, grassEdgeY - hillUnit * 0.05, width * 0.52, grassEdgeY - hillUnit * 0.09);
  bezierVertex(width * 0.62, grassEdgeY - hillUnit * 0.14, width * 0.73, grassEdgeY - hillUnit * 0.22, width * 0.82, grassEdgeY - hillUnit * 0.16);
  bezierVertex(width * 0.90, grassEdgeY - hillUnit * 0.11, width * 0.95, grassEdgeY - hillUnit * 0.06, width, grassEdgeY - hillUnit * 0.10);
  vertex(width, grassEdgeY);
  endShape(CLOSE);
  fill(72, 157, 82);
  beginShape();
  vertex(0, grassEdgeY);
  bezierVertex(width * 0.11, grassEdgeY - hillUnit * 0.05, width * 0.22, grassEdgeY - hillUnit * 0.12, width * 0.35, grassEdgeY - hillUnit * 0.08);
  bezierVertex(width * 0.48, grassEdgeY - hillUnit * 0.04, width * 0.56, grassEdgeY - hillUnit * 0.14, width * 0.67, grassEdgeY - hillUnit * 0.11);
  bezierVertex(width * 0.81, grassEdgeY - hillUnit * 0.07, width * 0.91, grassEdgeY - hillUnit * 0.03, width, grassEdgeY - hillUnit * 0.06);
  vertex(width, grassEdgeY);
  endShape(CLOSE);
  pop();

  // A quiet row of distant pines grounds the hills without competing with the
  // balloon or the flower field. Their bases disappear behind the meadow edge
  // so the row reads as one soft forest silhouette.
  const treeBaseY = grassEdgeY + (compact ? 7 : 10);
  const treeStep = compact ? 35 : 52;
  noStroke();
  fill(36, 105, 65, 175);
  for (let x = -treeStep; x < width + treeStep; x += treeStep) {
    const treeIndex = floor(x / treeStep);
    const treeHeight = (compact ? 44 : 64) + (treeIndex % 3) * (compact ? 7 : 10);
    const treeWidth = treeHeight * 0.25;
    const treeX = x + (treeIndex % 2) * treeStep * 0.18;
    // Keep each pine as one clean silhouette, with a slight jaggedness at the
    // branch tips to retain its recognisable forest shape.
    fill(42, 119, 73, 185);
    beginShape();
    vertex(treeX, treeBaseY - treeHeight);
    vertex(treeX - treeWidth * 0.46, treeBaseY - treeHeight * 0.66);
    vertex(treeX - treeWidth * 0.28, treeBaseY - treeHeight * 0.66);
    vertex(treeX - treeWidth * 0.80, treeBaseY - treeHeight * 0.35);
    vertex(treeX - treeWidth * 0.53, treeBaseY - treeHeight * 0.35);
    vertex(treeX - treeWidth * 1.10, treeBaseY);
    vertex(treeX + treeWidth * 1.10, treeBaseY);
    vertex(treeX + treeWidth * 0.53, treeBaseY - treeHeight * 0.35);
    vertex(treeX + treeWidth * 0.80, treeBaseY - treeHeight * 0.35);
    vertex(treeX + treeWidth * 0.28, treeBaseY - treeHeight * 0.66);
    vertex(treeX + treeWidth * 0.46, treeBaseY - treeHeight * 0.66);
    endShape(CLOSE);
  }
  const grassCurveRise = compact ? 10 : 14;
  fill(104, 187, 102);
  beginShape();
  vertex(0, grassEdgeY);
  bezierVertex(
    width * 0.25, grassEdgeY - grassCurveRise / 0.75,
    width * 0.75, grassEdgeY - grassCurveRise / 0.75,
    width, grassEdgeY
  );
  vertex(width, height);
  vertex(0, height);
  endShape(CLOSE);
  // Sparse, pale grass flecks add texture without turning the field into a
  // dense pattern. Their short, staggered marks stay stable frame to frame.
  const tuftStep = compact ? 76 : 94;
  const tuftRows = compact ? 2 : 3;
  stroke(191, 232, 139, 165);
  strokeWeight(compact ? 1.1 : 1.5);
  for (let row = 0; row < tuftRows; row++) {
    const tuftY = grassEdgeY + 40 + row * (compact ? 52 : 62);
    const offset = (row % 2) * tuftStep * 0.45;
    for (let x = -tuftStep + offset; x < width + tuftStep; x += tuftStep) {
      const variation = (floor(x / tuftStep) + row) % 3;
      const bladeH = (compact ? 3.5 : 4.5) + variation;
      const hasThirdBlade = variation === 2;
      stroke(hasThirdBlade ? color(149, 204, 109, 170) : color(191, 232, 139, 165));
      line(x, tuftY + 2, x - (compact ? 1.5 : 2), tuftY - bladeH);
      if (variation !== 1) {
        line(x + (compact ? 5 : 6), tuftY + 2, x + (compact ? 8 : 10), tuftY - bladeH * 0.4);
      }
      if (hasThirdBlade) {
        line(x + (compact ? 2.5 : 3), tuftY + 2, x + (compact ? 3.5 : 5), tuftY - bladeH * 0.75);
      }
    }
  }
  noStroke();
  // Draw the little crawlers before the blossoms so the foreground flowers
  // overlap them; the snail should always travel behind the flower bed.
  drawHomeWorm(getHomePlayBounds(), compact);
  drawMeadowSnail(compact);
  drawMeadowLadybug(compact);
  const flowers = [
    [0.04, 0.85, 0.48, [255, 125, 154]], [0.10, 0.80, 0.70, [255, 125, 154]],
    [0.16, 0.93, 0.55, [190, 132, 243]], [0.22, 0.83, 0.46, [255, 237, 116]],
    [0.26, 0.90, 0.55, [255, 237, 116]], [0.32, 0.79, 0.67, [190, 132, 243]],
    [0.39, 0.94, 0.43, [255, 125, 154]], [0.45, 0.84, 0.58, [255, 237, 116]],
    [0.52, 0.91, 0.70, [255, 125, 154]], [0.59, 0.80, 0.45, [190, 132, 243]],
    [0.65, 0.94, 0.52, [255, 237, 116]], [0.73, 0.84, 0.65, [190, 132, 243]],
    [0.79, 0.92, 0.46, [255, 125, 154]], [0.85, 0.79, 0.54, [255, 237, 116]],
    [0.91, 0.86, 0.67, [255, 125, 154]], [0.96, 0.94, 0.45, [190, 132, 243]]
  ];
  for (let i = 0; i < flowers.length; i++) {
    const [x, y, flowerScale, flowerColor] = flowers[i];
    const responsiveFlowerScale = compact ? flowerScale * 0.8 : flowerScale;
    // Offset each flower slightly so the field does not move in perfect unison.
    drawHomeFlower(width * x, height * y, responsiveFlowerScale * 2, color(...flowerColor), i * 0.7);
  }
}

function showHomeScreen() {
  push();
  const compact = width < 600 || height < 720;
  const centerX = width / 2;
  const titleY = compact ? height * 0.12 : height * 0.14;
  const heroY = compact ? height * 0.35 : height * 0.38;
  const bob = sin(millis() / 380) * 5;

  drawNatureBackground();
  textFont(sourGummyFont);
  textAlign(CENTER, CENTER);
  // A stacked mark lets the game name read as a single, ownable logo instead
  // of a line of interface text.
  drawHomeWordmark(centerX, titleY, compact);
  fill(36, 56, 84);
  textSize(compact ? 24 : 30);
  text("POP FOR SURPRISES!", centerX, titleY + (compact ? 65 : 91));

  // Draw Booboo on its own, without a frame or backdrop.
  // Give BooBoo more presence on the smaller mobile home screen while
  // retaining the existing desktop scale.
  const frameSize = compact ? 160 : 170;
  imageMode(CENTER);
  image(deflatedImg, centerX, heroY + bob - 1, frameSize * 1.5, frameSize * 1.5);
  imageMode(CORNER);
  // Keep every sparkle close to Booboo so they read as a little magical halo,
  // rather than as background decorations scattered across the screen.
  const sparkleScale = compact ? 0.8 : 1;
  drawHomeStar(centerX - frameSize * 0.56, heroY - frameSize * 0.40 + bob, 16 * sparkleScale, color(239, 93, 94));
  drawHomeStar(centerX + frameSize * 0.52, heroY - frameSize * 0.30 + bob, 14 * sparkleScale, color(73, 151, 182));
  drawHomeStar(centerX - frameSize * 0.51, heroY + frameSize * 0.35 + bob, 12 * sparkleScale, color(255, 247, 217));
  drawHomeStar(centerX + frameSize * 0.48, heroY + frameSize * 0.34 + bob, 13 * sparkleScale, color(246, 190, 82));

  const playButton = getHomePlayBounds();
  // Keep the original bounds for sizing, then shift only the mobile drawing.
  const signTop = heroY + frameSize * 0.78 + (compact ? 58 : 72);
  const signBottom = playButton.y - playButton.h / 2 - (compact ? 50 : 50);
  drawInstructionSignpost(centerX, signTop, signBottom, compact ? -30 : 0);

  drawArcadeButton(playButton, "PLAY");
  pop();
}

// The two-level treatment and offset shadow make this feel like a title mark
// while retaining the friendly Sour Gummy type used elsewhere.
function drawHomeWordmark(centerX, centerY, compact) {
  const navy = color(36, 56, 84);
  const white = color(255);
  const playRed = color(239, 93, 94);
  const topSize = compact ? 48 : 67;
  const bottomSize = compact ? 36 : 50;
  const gap = compact ? 40 : 53;
  const topY = centerY - gap / 2;
  const bottomY = centerY + gap / 2 + 5;

  push();
  textFont(sourGummyFont);
  textAlign(CENTER, CENTER);

  // A soft comic-book burst frames the stacked name and makes the title pop
  // from the sky without adding another panel around it.
  stroke(255, 190, 82);
  strokeWeight(compact ? 3 : 4);
  fill(255, 225, 102);
  drawHomeWordmarkBurst(centerX, centerY + (compact ? 2 : 4), compact ? 128 : 173, compact ? 70 : 94, 12);

  // A tiny offset makes the letters feel printed rather than like a heading.
  stroke(navy);
  strokeWeight(compact ? 10 : 13);
  fill(navy);
  textSize(topSize);
  text("BOOBOO", centerX + 3, topY + 5);
  stroke(white);
  strokeWeight(compact ? 6 : 8);
  fill(playRed);
  text("BOOBOO", centerX, topY);

  // Keep the second word visually separate so the stacked name reads as a
  // compact logo rather than a single line of display type.
  stroke(navy);
  strokeWeight(compact ? 8 : 10);
  fill(navy);
  textSize(bottomSize);
  text("BURST", centerX + 3, bottomY + 4);
  stroke(white);
  strokeWeight(compact ? 6 : 8);
  fill(playRed);
  text("BURST", centerX, bottomY - 1);
  pop();
}

function drawHomeWordmarkBurst(x, y, outerWidth, outerHeight, points) {
  // Intentionally uneven rays keep the burst playful and hand-drawn.
  const rayScale = [1.00, 0.95, 1.05, 0.92, 0.97, 1.03, 0.94, 1.06, 0.96, 1.02, 0.93, 1.04];
  const angleNudge = [0, -0.02, 0.012, -0.014, 0.024, -0.01, 0.016, -0.022, 0.009, -0.015, 0.02, -0.007];
  beginShape();
  for (let point = 0; point < points * 2; point++) {
    const rayIndex = floor(point / 2) % rayScale.length;
    const angle = -HALF_PI + point * PI / points + angleNudge[rayIndex];
    const isTip = point % 2 === 0;
    const radius = (isTip ? 1 : 0.72) * rayScale[rayIndex];
    vertex(
      x + cos(angle) * outerWidth * radius,
      y + sin(angle) * outerHeight * radius
    );
  }
  endShape(CLOSE);
}

// A clear top-to-bottom wash makes the sky deepen toward the horizon.
function drawHomeSky() {
  const skyTop = color("#48CAE4");
  const skyBottom = color("#c3f6ff");
  const bands = 300;

  noStroke();
  for (let band = 0; band < bands; band++) {
    const amount = band / (bands - 1);
    fill(lerpColor(skyTop, skyBottom, amount));
    const y = (height * band) / bands;
    rect(0, y, width, height / bands + 1);
  }
}

function showCountdownScreen() {
  drawGameplayBackground();
  const countdownY = height * 0.42;
  fill(255, 248, 215);
  stroke(36, 56, 84);
  strokeWeight(width < 600 ? 18 : 22);
  if (countdownTimer === "BLOW!") {
    textSize(width < 600 ? 86 : 124); // Keep the longer message prominent
  } else {
    textSize(width < 600 ? 234 : 312); // 30% larger 3, 2, 1 countdown numerals
  }
  textAlign(CENTER, CENTER);
  textFont(sourGummyFont);
  text(countdownTimer, width / 2, countdownY); // Display the countdown above center
}

function drawNeedle() {
  if (takingNeedle) {
    let angle = atan2(balloonY + getGameplayBalloonSway() - mouseY, balloonX - mouseX);
    push();
    translate(mouseX, mouseY);
    rotate(angle + 90);
    imageMode(CENTER);
    image(needleImg, 0, 0, buttonSize * 1.5, buttonSize * 1.5);
    pop();
  }
}

function soundBar() {
  // Treat the input display as a tiny toy control rather than a technical
  // equalizer: its rounded candy segments echo the rest of BooBoo's UI.
  const compact = width < 600;
  const panelW = min(width - 24, compact ? 300 : 340);
  const panelH = compact ? 45 : 50;
  const panelX = width / 2;
  const panelY = height - panelH / 2 - 48;
  const vol = mic ? mic.getLevel() : 0;
  const threshold = getSoundThreshold();
  const level = constrain(vol / threshold, 0, 1);
  const numBars = compact ? 10 : 12;
  const badgeSize = panelH - 10;
  // Nudge the full meter left so its right edge has the same comfortable
  // breathing room as the microphone side.
  const meterX = panelX - panelW / 2 + badgeSize + 12;
  const meterW = panelW - badgeSize - 38;
  const gap = compact ? 3 : 4;
  const segmentW = (meterW - gap * (numBars - 1)) / numBars;
  const activeSegments = ceil(level * numBars);

  push();
  rectMode(CENTER);

  // Use the same layered, slightly worn wood as the game signs so the input
  // meter reads as part of the playground rather than a separate HUD widget.
  noStroke();
  fill(105, 58, 34, 215);
  rect(panelX + 3, panelY + 4, panelW, panelH, panelH / 2);
  fill(151, 85, 43);
  rect(panelX, panelY, panelW, panelH, panelH / 2);
  fill(194, 119, 57);
  rect(panelX, panelY - 1, panelW * 0.96, panelH * 0.86, panelH * 0.43);
  fill(239, 166, 85, 155);
  rect(panelX - panelW * 0.06, panelY - panelH * 0.30, panelW * 0.72, max(2, panelH * 0.065), 4);

  // The pale inset keeps the candy bars and microphone clear against the
  // wood, just like the icon inset on the needle tool.
  fill(255, 248, 215);
  rect(panelX, panelY, panelW * 0.89, panelH * 0.63, panelH * 0.315);

  // Match the microphone badge to the wood panel behind it.
  noStroke();
  fill(194, 119, 57);
  ellipse(panelX - panelW / 2 + badgeSize / 2 + 6, panelY, badgeSize, badgeSize);
  const micX = panelX - panelW / 2 + badgeSize / 2 + 6;
  drawMicrophoneIcon(micX, panelY - badgeSize * 0.03, badgeSize * 0.72);

  // Active segments progress with the input: light green at the quiet end,
  // through orange in the middle, then deep red at the loud end.
  noStroke();
  for (let i = 0; i < numBars; i++) {
    const x = meterX + i * (segmentW + gap) + segmentW / 2;
    const isActive = i < activeSegments;
    if (isActive) {
      const meterMix = i / max(1, numBars - 1);
      const meterColor = meterMix < 0.5
        ? lerpColor(color(185, 235, 170), color(245, 151, 45), meterMix * 2)
        : lerpColor(color(245, 151, 45), color(164, 28, 35), (meterMix - 0.5) * 2);
      fill(meterColor);
      if (level >= 1 && i === activeSegments - 1) {
        fill(164, 28, 35);
      }
    } else {
      fill(217, 228, 222);
    }
    rect(x, panelY, segmentW, panelH * 0.30, segmentW / 2);
  }

  pop();
}

function drawMicrophoneIcon(x, y, size) {
  // Match the simple studio-microphone silhouette: a tall capsule inside a
  // deep U-shaped cradle, joined to a short stem and wide rounded base.
  const ink = color(255, 214, 103);
  const bodyW = size * 0.32;
  const bodyH = size * 0.58;
  const bodyY = y - size * 0.17;
  const cradleWeight = max(2.5, size * 0.13);

  push();
  rectMode(CENTER);
  strokeCap(ROUND);
  strokeJoin(ROUND);

  // Solid, pill-shaped microphone body.
  noStroke();
  fill(ink);
  rect(x, bodyY, bodyW, bodyH, bodyW / 2);

  // Open cradle with upright sides and a deep, symmetrical rounded bottom.
  noFill();
  stroke(ink);
  strokeWeight(cradleWeight);
  beginShape();
  vertex(x - size * 0.29, y - size * 0.04);
  vertex(x - size * 0.29, y + size * 0.08);
  bezierVertex(
    x - size * 0.29, y + size * 0.27,
    x - size * 0.17, y + size * 0.34,
    x, y + size * 0.34
  );
  bezierVertex(
    x + size * 0.17, y + size * 0.34,
    x + size * 0.29, y + size * 0.27,
    x + size * 0.29, y + size * 0.08
  );
  vertex(x + size * 0.29, y - size * 0.04);
  endShape();

  // Central stand and broad pill-shaped foot.
  strokeWeight(max(2.2, size * 0.12));
  line(x, y + size * 0.34, x, y + size * 0.46);
  strokeWeight(max(2.8, size * 0.14));
  line(x - size * 0.27, y + size * 0.47, x + size * 0.27, y + size * 0.47);
  pop();
}

function deviceShaken() {
  partyMode();
}
