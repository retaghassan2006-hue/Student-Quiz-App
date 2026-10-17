// result.js - Show final score, percentage, pass/fail, and result history

const resultUser = JSON.parse(localStorage.getItem("currentUser"));
const savedResult = JSON.parse(localStorage.getItem("quizScore"));

// Protect the page
if (!resultUser) {
    window.location.href = "index.html";
} else if (!savedResult) {
    // Logged in but no quiz finished yet
    window.location.href = "quiz.html";
} else {
    const { score, total } = savedResult;
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 50;

    document.querySelector("#studentName").textContent = resultUser.name;
    document.querySelector("#score").textContent = score;
    document.querySelector("#total").textContent = total;
    document.querySelector("#percentage").textContent = `${percentage}%`;

    const status = document.querySelector("#status");
    if (passed) {
        status.className = "alert alert-success";
        status.textContent = "Congratulations! You passed the quiz.";
    } else {
        status.className = "alert alert-danger";
        status.textContent = "You did not pass this time. Try again!";
    }

    showHistory();

    document.querySelector("#retryBtn").addEventListener("click", () => {
        localStorage.removeItem("quizScore");
        localStorage.removeItem("quizProgress");
        window.location.href = "quiz.html";
    });
}

// show this student's saved attempts (newest first)
function showHistory() {
    const history = JSON.parse(localStorage.getItem("quizHistory")) || [];
    const myAttempts = history
        .filter((attempt) => attempt.studentId === resultUser.id)
        .reverse();

    const body = document.querySelector("#historyBody");

    if (myAttempts.length === 0) {
        body.innerHTML = `<tr><td colspan="5" class="text-muted">No attempts yet.</td></tr>`;
        return;
    }

    body.innerHTML = myAttempts
        .map((attempt, i) => {
            const passed = attempt.percentage >= 50;
            const date = new Date(attempt.date).toLocaleString();
            return `
        <tr>
          <td>${myAttempts.length - i}</td>
          <td>${date}</td>
          <td>${attempt.score}/${attempt.total}</td>
          <td>${attempt.percentage}%</td>
          <td><span class="badge ${passed ? "text-bg-success" : "text-bg-danger"}">${passed ? "Pass" : "Fail"}</span></td>
        </tr>`;
        })
        .join("");
}