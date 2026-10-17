// quiz.js - Fetch questions, display quiz, score, timer, shuffle, progress, history

// Protect the page: must be logged in
const user = JSON.parse(localStorage.getItem("currentUser"));
if (!user) {
    window.location.href = "index.html";
}

const TIME_PER_QUESTION = 30; // seconds 
const PROGRESS_KEY = "quizProgress";
const HISTORY_KEY = "quizHistory";

let questions = []; // questions in the order shown to the student
let currentQuestionIndex = 0;
let score = 0;
let answers = []; // selected answer index for each question (null = no answer)
let timeLeft = TIME_PER_QUESTION;
let timerId = null;

const studentName = document.querySelector("#studentName");
const loading = document.querySelector("#loading");
const quizBox = document.querySelector("#quizBox");
const questionNumber = document.querySelector("#questionNumber");
const progressText = document.querySelector("#progressText");
const progressBar = document.querySelector("#progressBar");
const questionText = document.querySelector("#questionText");
const answersBox = document.querySelector("#answers");
const nextBtn = document.querySelector("#nextBtn");
const prevBtn = document.querySelector("#prevBtn");
const timerBadge = document.querySelector("#timer");

if (user) studentName.textContent = user.name;

/* ---------- Helpers ---------- */

function showMessage(text, type = "danger") {
    const box = document.querySelector("#message");
    box.className = `alert alert-${type}`;
    box.textContent = text;
}

function clearMessage() {
    document.querySelector("#message").className = "alert d-none";
}

// Fisher-Yates shuffle (returns a new array)
function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function calculateScore() {
    return answers.filter((answer, i) => answer === questions[i].correctAnswer).length;
}

/* ---------- save / restore progress ---------- */

function saveProgress() {
    score = calculateScore();
    localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({
            userId: user.id,
            order: questions.map((q) => q.id),
            currentQuestionIndex,
            score,
            answers
        })
    );
}

function isValidProgress(saved, allQuestions) {
    return (
        saved &&
        saved.userId === user.id &&
        Array.isArray(saved.order) &&
        saved.order.length === allQuestions.length &&
        saved.order.every((id) => allQuestions.some((q) => q.id === id)) &&
        Array.isArray(saved.answers) &&
        saved.answers.length === saved.order.length &&
        Number.isInteger(saved.currentQuestionIndex) &&
        saved.currentQuestionIndex >= 0 &&
        saved.currentQuestionIndex < saved.order.length
    );
}

function startQuiz(allQuestions) {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY));

    if (isValidProgress(saved, allQuestions)) {
        // Continue where the student stopped (same random order)
        questions = saved.order.map((id) => allQuestions.find((q) => q.id === id));
        currentQuestionIndex = saved.currentQuestionIndex;
        answers = saved.answers;
        score = saved.score;
    } else {
        // New quiz with random order
        questions = shuffle(allQuestions);
        answers = questions.map(() => null);
        currentQuestionIndex = 0;
        score = 0;
        saveProgress();
    }
}

/* ---------- Fetch questions ---------- */

async function loadQuestions() {
    try {
        const response = await fetch("data/questions.json");
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const allQuestions = await response.json();

        if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
            throw new Error("No questions found.");
        }

        startQuiz(allQuestions);

        loading.classList.add("d-none");
        quizBox.classList.remove("d-none");
        showQuestion();
    } catch (error) {
        loading.classList.add("d-none");
        showMessage(
            "Sorry, the questions could not be loaded. Make sure you are using Live Server. (" +
            error.message + ")"
        );
    }
}

/* ---------- timer ---------- */

function updateTimerDisplay() {
    timerBadge.textContent = `${timeLeft}s`;
    timerBadge.className =
        timeLeft <= 10 ? "badge text-bg-danger fs-6" : "badge text-bg-primary fs-6";
}

function stopTimer() {
    clearInterval(timerId);
    timerId = null;
}

function startTimer() {
    stopTimer();
    timeLeft = TIME_PER_QUESTION;
    updateTimerDisplay();

    timerId = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            stopTimer();
            handleTimeUp();
        }
    }, 1000);
}

function handleTimeUp() {
    goNext(true);
    showMessage("Time is up! Moving to the next question.", "warning");
}

/* ---------- Display ---------- */

function showQuestion() {
    const q = questions[currentQuestionIndex];
    clearMessage();

    const number = currentQuestionIndex + 1;
    const percent = Math.round((currentQuestionIndex / questions.length) * 100);
    questionNumber.textContent = `Question ${number} of ${questions.length}`;
    progressText.textContent = `${percent}% completed`;
    progressBar.style.width = `${percent}%`;
    questionText.textContent = q.question;

    answersBox.innerHTML = "";
    q.choices.forEach((choice, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "answer-btn";
        btn.textContent = choice;
        // Re-highlight the answer if the student already chose one
        if (answers[currentQuestionIndex] === index) btn.classList.add("selected");
        btn.addEventListener("click", () => selectAnswer(index, btn));
        answersBox.appendChild(btn);
    });

    nextBtn.textContent = number === questions.length ? "Finish" : "Next";
    prevBtn.disabled = currentQuestionIndex === 0;

    startTimer();
}

function selectAnswer(index, clickedBtn) {
    answers[currentQuestionIndex] = index;
    clearMessage();
    answersBox.querySelectorAll(".answer-btn").forEach((b) => b.classList.remove("selected"));
    clickedBtn.classList.add("selected");
    saveProgress();
}

/* ---------- Next / Previous / Finish ---------- */

// force = true when the timer ran out (no answer required)
function goNext(force = false) {
    if (!force && answers[currentQuestionIndex] === null) {
        return showMessage("Please select an answer before continuing.", "warning");
    }

    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        saveProgress();
        showQuestion();
    } else {
        finishQuiz();
    }
}

// Previous button
function goPrevious() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        saveProgress();
        showQuestion();
    }
}

function finishQuiz() {
    stopTimer();
    score = calculateScore();
    const total = questions.length;

    // Save final score for the result page
    localStorage.setItem("quizScore", JSON.stringify({ score, total }));

    // save this attempt in the history array
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    history.push({
        studentId: user.id,
        studentName: user.name,
        email: user.email,
        score,
        total,
        percentage: Math.round((score / total) * 100),
        date: new Date().toISOString()
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // Quiz finished: clear the saved progress
    localStorage.removeItem(PROGRESS_KEY);
    window.location.href = "result.html";
}

nextBtn.addEventListener("click", () => goNext(false));
prevBtn.addEventListener("click", goPrevious);

if (user) loadQuestions();