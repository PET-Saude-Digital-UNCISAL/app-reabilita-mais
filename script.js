const screens = Array.from(document.querySelectorAll('.screen'));
const nextButtons = document.querySelectorAll('[data-next]');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');

const quizForm = document.getElementById('quizForm');
const quizFeedback = document.getElementById('quizFeedback');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const quizContinueBtn = document.getElementById('quizContinueBtn');
const restartBtn = document.getElementById('restartBtn');

let currentScreen = 0;

function updateProgress() {
  const step = currentScreen + 1;
  progressText.textContent = `Tela ${step} de ${screens.length}`;
  progressFill.style.width = `${(step / screens.length) * 100}%`;
  document
    .querySelector('.progress-bar')
    .setAttribute('aria-valuenow', String(step));
}

function showScreen(index) {
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
    `;

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
  `;

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

updateProgress();
