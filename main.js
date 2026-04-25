const usernameInput = document.getElementById("username");
const searchBtn = document.getElementById("searchBtn");
const nextBtn = document.getElementById("nextBtn");
const statusDiv = document.getElementById("status");
const profileDiv = document.getElementById("profile");
const reposDiv = document.getElementById("repos");
const commitsDiv = document.getElementById("commits");
const rateDiv = document.getElementById("rate");
let page = 1;
let currentUsername = "";
let controller = null;
// =========================
// イベント
// =========================
searchBtn.addEventListener("click", () => startSearch());
usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") startSearch();
});
nextBtn.addEventListener("click", () => {
  page++;
  fetchRepos(currentUsername);
});
// =========================
// 検索開始
// =========================
function startSearch() {
  page = 1;
  currentUsername = usernameInput.value.trim();

  if (!currentUsername) return;

  fetchUser(currentUsername);
  fetchRateLimit();
}

// =========================
// 共通 fetch（Abort対応）
// =========================
async function fetchData(url) {
  if (controller) controller.abort();
  controller = new AbortController();

  try {
    statusDiv.textContent = "読み込み中...";

    const res = await fetch(url, {
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error("APIエラー: " + res.status);
    }

    const data = await res.json();
    statusDiv.textContent = "";

    return data;

  } catch (err) {
    if (err.name === "AbortError") return;
    statusDiv.textContent = "エラー: " + err.message;
    console.error(err);
  }
}
// =========================
// ユーザー取得
// =========================
async function fetchUser(username) {
  const data = await fetchData(`https://api.github.com/users/${username}`);
  if (!data) return;

  profileDiv.innerHTML = `
    <h3>${data.login}</h3>
    <img src="${data.avatar_url}" width="100">
    <p>${data.bio || "No bio"}</p>
  `;

  fetchRepos(username);
}
// =========================
// リポジトリ取得
// =========================
async function fetchRepos(username) {
  const data = await fetchData(
    `https://api.github.com/users/${username}/repos?per_page=30&page=${page}&sort=updated`
  );
  if (!data) return;

  if (data.length === 0) {
    reposDiv.innerHTML = "<p>リポジトリなし</p>";
    return;
  }

  // スター順ソート
  data.sort((a, b) => b.stargazers_count - a.stargazers_count);

  reposDiv.innerHTML = data.map(repo => `
    <div class="repo" data-owner="${repo.owner.login}" data-name="${repo.name}">
      ⭐ ${repo.stargazers_count} - ${repo.name}
    </div>
  `).join("");
}
// =========================
// コミット取得（イベント委譲）
// =========================
reposDiv.addEventListener("click", async (e) => {
  const repoEl = e.target.closest(".repo");
  if (!repoEl) return;

  const owner = repoEl.dataset.owner;
  const name = repoEl.dataset.name;

  const data = await fetchData(
    `https://api.github.com/repos/${owner}/${name}/commits`
  );
  if (!data) return;

  commitsDiv.innerHTML = data.slice(0, 5).map(c => `
    <div>
      ${c.commit.message}
    </div>
  `).join("");
});
// =========================
// Rate Limit
// =========================
async function fetchRateLimit() {
  const data = await fetchData("https://api.github.com/rate_limit");
  if (!data) return;

  rateDiv.textContent = `残り回数: ${data.rate.remaining}`;
}
// =========================
// debounce（おまけ）
// =========================
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}