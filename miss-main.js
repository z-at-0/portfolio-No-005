/*---確認用---------------------------*/
const  usernameInput = document.getElementById("username");
usernameInput.addEventListener("keydown",  (e) => {
    if (e.key  ===  "Enter") {
        console.log("Enter押された");/*-----コメントアウト予定---*/
    }
});
/*アカウント名・アイコン、自己紹介まで検索可能とした------------------------------*/
const searchBtn = document.getElementById("searchBtn");
searchBtn.addEventListener("click",() => {
    const username  = usernameInput.value.trim();
    if (!username) return;
    fetchUser(username);
    fetchRepos(username);
});
async function fetchUser(username){
    try {
        const res = await fetch(`https://api.github.com/users/${username}`);
        if (!res.ok) {
            throw new Error("ユーザーが見つかりません");
        }
        const data = await res.json();
        console.log(data);
        const profileDiv = document.getElementById("profile");
        profileDiv.innerHTML = `
            <h3>${data.login}</h3>
            <img src = "${data.avatar_url}" width="100">
            <p>${data.bio || "no bio"}</p>
        `;
    } catch (err) {
        console.error(err);
    }
}
async function fetchRepos(username) {
    try {
        const res = await fetch(`https://api.github.com/users/${username}/repos`);
        if (!res.ok) {throw new Error("リポジトリ取得失敗");}
        const data = await res.json();
        const reposDiv = document.getElementById("repos");
// ① いったんHTML生成（クリック用のdata属性を仕込む）
        reposDiv.innerHTML = data.map((repo, index) => `
        <div class="repo-item" data-index="${index}" style="cursor:pointer;">
            ${repo.name}
            </div>
        `).join("");
// ② クリックイベントをまとめて設定
        const items = document.querySelectorAll(".repo-item");
        items.forEach(item => {
            item.addEventListener("click",() => {
                const index = item.dataset.index;
                const repo = data[index];
 // ③ 詳細表示
                showRepoDetail(repo);
            });
        });
        console.log(data);/*-----コメントアウト予定---*/
    } catch (err) {
        console.error(err);
    }
}
// ■詳細表示関数
function showRepoDetail(repo) {
    const datailDiv = document.getElementById("repo-detail");
    datailDiv.innerHTML = `
        <h3>${repo.name}</h3>
        <p>⭐ スター数:${repo.stargazers_count}</p>
        <p>${repo.description || "説明なし"}</p>
        <a href="${repo.html_url}" target="_blank">GitHubで見る</a>
    `;
}
