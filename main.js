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
let reposCache = []; // ★これ追加（重要）

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
// 共通 fetch
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

  reposCache = data; // ★保存

  if (data.length === 0) {
    reposDiv.innerHTML = "<p>リポジトリなし</p>";
    return;
  }

  data.sort((a, b) => b.stargazers_count - a.stargazers_count);

  reposDiv.innerHTML = data.map((repo, index) => `
    <div class="repo-item" data-index="${index}" style="cursor:pointer;">
      ⭐ ${repo.stargazers_count} - ${repo.name}
    </div>
  `).join("");
}

// =========================
// ★イベント委譲（ここが本体）
// =========================
reposDiv.addEventListener("click", async (e) => {
  const repoEl = e.target.closest(".repo-item");
  if (!repoEl) return;

  const index = repoEl.dataset.index;
  const repo = reposCache[index];

  showRepoDetail(repo);
});

// =========================
// 詳細表示
// =========================
function showRepoDetail(repo) {
  const detailDiv = document.getElementById("repo-detail");

  detailDiv.innerHTML = `
    <h3>${repo.name}</h3>
    <p>⭐ ${repo.stargazers_count}</p>
    <p>${repo.description || "説明なし"}</p>
    <a href="${repo.html_url}" target="_blank">GitHubで見る</a>
  `;
}

// =========================
// Rate Limit
// =========================
async function fetchRateLimit() {
  const data = await fetchData("https://api.github.com/rate_limit");
  if (!data) return;

  rateDiv.textContent = `残り回数: ${data.rate.remaining}`;
}