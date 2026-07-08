const screens = Array.from(document.querySelectorAll('.screen'));

const nextButtons = document.querySelectorAll('[data-next]');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const welcomeVideo = document.querySelector('.welcome-video');
const videoPlayBtn = document.getElementById('videoPlayBtn');

const quizForm = document.getElementById('quizForm');
const quizFeedback = document.getElementById('quizFeedback');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const quizContinueBtn = document.getElementById('quizContinueBtn');
const restartBtn = document.getElementById('restartBtn');

const audioByKey = {
  't1-p12': 'Tela 1 - Parte 12.mp3.mpeg',
  't1-p22': 'Tela 1 - Parte 22.mp3.mpeg',
  't2-p12': 'Tela 2 - Parte 12.mp3.mpeg',
  't2-p22': 'Tela 2 - Parte 22.mp3.mpeg',
  't3-p12': 'Tela 3 - Parte 12.mp3.mpeg',
  't3-p22': 'Tela 3 - Parte 22.mp3.mpeg',
  't4-p13': 'Tela 4 - Parte 13.mp3.mpeg',
  't4-p23': 'Tela 4 - Parte 23.mp3.mpeg',
  't4-p33': 'Tela 4 - Parte 33.mp3.mpeg',
  't5-p12': 'Tela 5 - Parte 12.mp3.mpeg',
  't5-p22': 'Tela 5 - Parte 22.mp3.mpeg',
  't6-p12': 'Tela 6 - Parte 12.mp3.mpeg',
  't6-p22': 'Tela 6 - Parte 22.mp3.mpeg',
  't7-p13': 'Tela 7 - Parte 13.mp3.mpeg',
  't7-p23': 'Tela 7 - Parte 23 (resposta errada).mp3.mpeg',
  't7-p33': 'Tela 7 - Parte 33 (resposta certa).mp3.mpeg',
  't8-p12': 'Tela 8 - Parte 12.mp3.mpeg',
  't8-p22': 'Tela 8 - Parte 22.mp3.mpeg',
  't9-p12': 'Tela 9 - Parte 12.mp3.mpeg',
  't10-p01': ['parte 10 01.m4a', 'parte 10 01.mp4', '10 01.m4a', '10 01.mp4', 'Tela 10 01.m4a', 'Tela 10 01.mp4'],
  't10-p02': ['parte 10 02.m4a', 'parte 10 02.mp4', '10 02.m4a', '10 02.mp4', 'Tela 10 02.m4a', 'Tela 10 02.mp4']
};

let currentScreen = 0;
let activeAudio = null;
let activeAudioButton = null;
let activeObjectUrl = null;
const audioFolders = ['audio', 'audios'];

function createMediaPlayer(fileNames) {
  const hasMp4 = fileNames.some((name) => name.toLowerCase().endsWith('.mp4'));

  if (!hasMp4) {
    return new Audio();
  }

  const videoPlayer = document.createElement('video');
  videoPlayer.playsInline = true;
  videoPlayer.style.position = 'absolute';
  videoPlayer.style.width = '0';
  videoPlayer.style.height = '0';
  videoPlayer.style.opacity = '0';
  videoPlayer.style.pointerEvents = 'none';
  document.body.appendChild(videoPlayer);
  return videoPlayer;
}

function stopActiveAudio() {
  if (!activeAudio) {
    return;
  }

  activeAudio.pause();
  activeAudio.currentTime = 0;

  if (activeAudioButton) {
    activeAudioButton.classList.remove('playing');
    activeAudioButton.setAttribute('aria-pressed', 'false');
    activeAudioButton.title = 'Ouvir este áudio';
  }

  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }

  if (activeAudio.tagName === 'VIDEO') {
    activeAudio.remove();
  }

  activeAudio = null;
  activeAudioButton = null;
}

function playMappedAudio(audioKey, button) {
  const fileMapValue = audioByKey[audioKey];
  const fileNames = Array.isArray(fileMapValue) ? fileMapValue : [fileMapValue];

  if (!fileMapValue) {
    return;
  }

  if (activeAudio && activeAudioButton === button) {
    stopActiveAudio();
    return;
  }

  stopActiveAudio();

  const player = createMediaPlayer(fileNames);
  player.preload = 'none';

  const sourceCandidates = [];
  fileNames.forEach((name) => {
    audioFolders.forEach((folder) => {
      sourceCandidates.push(encodeURI(`${folder}/${name}`));
    });
  });
  let sourceIndex = 0;
  let playbackStarted = false;

  const startPlayback = () => {
    activeAudio = player;
    activeAudioButton = button;
    button.classList.add('playing');
    button.setAttribute('aria-pressed', 'true');
    button.title = 'Parar este áudio';
    playbackStarted = true;
  };

  const tryNextSource = async () => {
    if (playbackStarted) {
      return;
    }

    if (sourceIndex >= sourceCandidates.length) {
      stopActiveAudio();
      return;
    }

    const candidate = sourceCandidates[sourceIndex];
    sourceIndex += 1;

    player.src = candidate;

    try {
      await player.play();
      startPlayback();
      return;
    } catch {
      try {
        const response = await fetch(candidate);
        if (!response.ok) {
          throw new Error('Falha ao carregar blob de áudio.');
        }

        const audioBlob = await response.blob();
        if (activeObjectUrl) {
          URL.revokeObjectURL(activeObjectUrl);
        }
        activeObjectUrl = URL.createObjectURL(audioBlob);
        player.src = activeObjectUrl;
        await player.play();
        startPlayback();
        return;
      } catch {
        await tryNextSource();
      }
    }
  };

  player.addEventListener('error', () => {
    if (!playbackStarted) {
      tryNextSource();
    }
  });

  tryNextSource();

  player.addEventListener('ended', () => {
    if (activeAudio === player) {
      stopActiveAudio();
    }
  });
}

function placeAudioButtonBesideElement(button) {
  const target = button.previousElementSibling;

  if (!target) {
    return;
  }

  if (button.parentElement && button.parentElement.classList.contains('audio-side')) {
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'audio-side';

  target.parentNode.insertBefore(wrapper, target);
  wrapper.appendChild(target);
  wrapper.appendChild(button);
}

function setupAudioButton(button) {
  if (!button || button.dataset.audioReady === 'true') {
    return;
  }

  placeAudioButtonBesideElement(button);

  button.addEventListener('click', () => {
    playMappedAudio(button.dataset.audioKey, button);
  });

  button.dataset.audioReady = 'true';
}

document.querySelectorAll('[data-audio-key]').forEach((button) => {
  setupAudioButton(button);
});

function updateProgress() {
  const step = currentScreen + 1;
  progressText.textContent = `Tela ${step} de ${screens.length}`;
  progressFill.style.width = `${(step / screens.length) * 100}%`;
  document
    .querySelector('.progress-bar')
    .setAttribute('aria-valuenow', String(step));
}

function showScreen(index) {
  stopActiveAudio();

  screens.forEach((screen, i) => {
    screen.classList.toggle('active', i === index);
  });

  currentScreen = index;
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetQuiz() {
  quizForm.reset();
  quizFeedback.hidden = true;
  quizFeedback.className = 'feedback';
  quizFeedback.innerHTML = '';
  tryAgainBtn.hidden = true;
  quizContinueBtn.hidden = true;
}

nextButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (currentScreen < screens.length - 1) {
      showScreen(currentScreen + 1);

      if (currentScreen === 6) {
        resetQuiz();
      }
    }
  });
});

quizForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const chosen = quizForm.querySelector('input[name="answer"]:checked');

  if (!chosen) {
    quizFeedback.hidden = false;
    quizFeedback.className = 'feedback error';
    quizFeedback.innerHTML = 'Escolha uma opção para continuar.';
    tryAgainBtn.hidden = true;
    quizContinueBtn.hidden = true;
    return;
  }

  if (chosen.value === 'verdadeiro') {
    quizFeedback.hidden = false;
    quizFeedback.className = 'feedback error';
    quizFeedback.innerHTML = `
      <p><strong>Ops! Essa resposta não está correta.</strong></p>
      <p>
        Mesmo poucas faltas podem interromper a continuidade do tratamento,
        dificultar sua evolução e aumentar o tempo necessário para alcançar seus objetivos.
      </p>
      <p>
        Cada sessão é planejada para dar sequência ao seu processo de reabilitação.
      </p>
      <p>
        Sempre que possível, compareça às sessões e, caso não possa ir, avise a equipe.
      </p>
      <button class="audio-inline-btn" type="button" data-audio-key="t7-p23" aria-label="Ouvir áudio da resposta errada" aria-pressed="false">🔊</button>
    `;

    const wrongAudioBtn = quizFeedback.querySelector('[data-audio-key="t7-p23"]');
    if (wrongAudioBtn) {
      setupAudioButton(wrongAudioBtn);
    }

    tryAgainBtn.hidden = false;
    quizContinueBtn.hidden = false;
    return;
  }

  quizFeedback.hidden = false;
  quizFeedback.className = 'feedback success';
  quizFeedback.innerHTML = `
    <p><strong>Parabéns! Você acertou!</strong></p>
    <p>
      Comparecer regularmente às sessões favorece a continuidade do tratamento,
      potencializa os resultados e reduz o risco de retrocessos.
    </p>
    <p>
      Cada sessão representa mais um passo em direção à sua recuperação. Continue firme!
    </p>
    <button class="audio-inline-btn" type="button" data-audio-key="t7-p33" aria-label="Ouvir áudio da resposta certa" aria-pressed="false">🔊</button>
  `;

  const rightAudioBtn = quizFeedback.querySelector('[data-audio-key="t7-p33"]');
  if (rightAudioBtn) {
    setupAudioButton(rightAudioBtn);
  }

  tryAgainBtn.hidden = true;
  quizContinueBtn.hidden = false;
});

tryAgainBtn.addEventListener('click', () => {
  resetQuiz();
});

quizContinueBtn.addEventListener('click', () => {
  if (currentScreen < screens.length - 1) {
    showScreen(currentScreen + 1);
  }
});

restartBtn.addEventListener('click', () => {
  resetQuiz();
  showScreen(0);
});

if (welcomeVideo && videoPlayBtn) {
  videoPlayBtn.addEventListener('click', async () => {
    try {
      if (welcomeVideo.paused) {
        await welcomeVideo.play();
        videoPlayBtn.textContent = 'Pausar vídeo';
      } else {
        welcomeVideo.pause();
        videoPlayBtn.textContent = 'Reproduzir vídeo';
      }
    } catch {
      videoPlayBtn.textContent = 'Não foi possível reproduzir';
    }
  });

  welcomeVideo.addEventListener('ended', () => {
    videoPlayBtn.textContent = 'Reproduzir vídeo';
  });
}

updateProgress();
