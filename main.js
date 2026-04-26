// --- 要素の取得 ---
const usernameInput = document.getElementById("username");
const searchBtn = document.getElementById("searchBtn");
const nextBtn = document.getElementById("nextBtn");
const statusDiv = document.getElementById("status");
const profileDiv = document.getElementById("profile");
const reposDiv = document.getElementById("repos");
const repoDetailDiv = document.getElementById("repo-detail"); // 詳細表示用
const commitsDiv = document.getElementById("commits");
const rateDiv = document.getElementById("rate");

let page = 1;
let currentUsername = "";
let controller = null;

// =========================
// イベントリスナー
// =========================
searchBtn.addEventListener("click", () => startSearch());

usernameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startSearch();
});

nextBtn.addEventListener("click", () => {
    page++;
    fetchRepos(currentUsername);
});

// リポジトリ一覧のクリックイベント（イベント委譲）
reposDiv.addEventListener("click", async (e) => {
    const repoEl = e.target.closest(".repo-item");
    if (!repoEl) return;

    const owner = repoEl.dataset.owner;
    const name = repoEl.dataset.name;

    // 1. 詳細情報を表示するためのデータを取得（既に一覧にあるデータを使用）
    // 本来は再取得しても良いですが、今回はUIをサクサク動かすため
    // 選択されたリポジトリのコミット情報を取得しに行きます
    fetchRepoCommits(owner, name);
    
    // 詳細表示の見た目を更新（カスタムデータ属性から取得）
    showRepoSummary(repoEl.dataset);
});

// =========================
// 検索開始
// =========================
function startSearch() {
    page = 1;
    currentUsername = usernameInput.value.trim();
    if (!currentUsername) return;

    // 初期化
    profileDiv.innerHTML = "";
    reposDiv.innerHTML = "";
    repoDetailDiv.innerHTML = "";
    commitsDiv.innerHTML = "";

    fetchUser(currentUsername);
    fetchRateLimit();
}

// =========================
// 共通 fetch 関数（Abort対応）
// =========================
async function fetchData(url) {
    // 実行中のリクエストがあれば中断
    if (controller) controller.abort();
    controller = new AbortController();

    try {
        statusDiv.textContent = "読み込み中...";
        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) {
            throw new Error(`エラー: ${res.status}`);
        }

        const data = await res.json();
        statusDiv.textContent = "";
        return data;
    } catch (err) {
        if (err.name === "AbortError") {
            console.log("前のリクエストがキャンセルされました");
            return null;
        }
        statusDiv.textContent = "エラーが発生しました: " + err.message;
        console.error(err);
        return null;
    }
}

// =========================
// API 取得処理
// =========================

// ユーザー情報
async function fetchUser(username) {
    const data = await fetchData(`https://api.github.com/users/${username}`);
    if (!data) return;

    profileDiv.innerHTML = `
        <h3>${data.login}</h3>
        <img src="${data.avatar_url}" width="100" style="border-radius: 50%;">
        <p>${data.bio || "自己紹介なし"}</p>
    `;
    fetchRepos(username);
}

// リポジトリ一覧
async function fetchRepos(username) {
    const data = await fetchData(
        `https://api.github.com/users/${username}/repos?per_page=10&page=${page}&sort=updated`
    );
    if (!data) return;

    if (data.length === 0) {
        reposDiv.innerHTML += "<p>これ以上のリポジトリはありません</p>";
        return;
    }

    // スター数順にソート（現在のページ内）
    data.sort((a, b) => b.stargazers_count - a.stargazers_count);

    const html = data.map(repo => `
        <div class="repo-item" 
             data-owner="${repo.owner.login}" 
             data-name="${repo.name}"
             data-stars="${repo.stargazers_count}"
             data-description="${repo.description || '説明なし'}"
             data-url="${repo.html_url}"
             style="cursor:pointer; border:1px solid #ccc; margin:5px; padding:10px;">
            <strong>⭐ ${repo.stargazers_count}</strong> - ${repo.name}
        </div>
    `).join("");

    // ページネーション時は追加、新規検索時は上書き
    if (page === 1) {
        reposDiv.innerHTML = html;
    } else {
        reposDiv.innerHTML += html;
    }
}

// コミット履歴
async function fetchRepoCommits(owner, name) {
    const data = await fetchData(`https://api.github.com/repos/${owner}/${name}/commits?per_page=5`);
    if (!data) return;

    commitsDiv.innerHTML = "<h4>最近のコミット</h4>" + data.map(c => `
        <div style="font-size: 0.9em; border-bottom: 1px dashed #eee;">
            ${c.commit.message.substring(0, 50)}...
        </div>
    `).join("");
    // メッセージだけを配列にして表示
    console.log("--- コミットメッセージ一覧 ---");
    console.log(data.map(c => c.commit.message));
}

// =========================
// UI更新ヘルパー
// =========================

// リポジトリ詳細の要約表示
function showRepoSummary(dataset) {
    repoDetailDiv.innerHTML = `
        <hr>
        <h3>選択中のリポジトリ: ${dataset.name}</h3>
        <p>⭐ スター数: ${dataset.stars}</p>
        <p>説明: ${dataset.description}</p>
        <a href="${dataset.url}" target="_blank">GitHubで直接開く</a>
    `;
}

// レート制限表示
async function fetchRateLimit() {
    const res = await fetch("https://api.github.com/rate_limit");
    const data = await res.json();
    rateDiv.textContent = `API残り回数: ${data.rate.remaining} / ${data.rate.limit}`;
}