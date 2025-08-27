const $ = (sel, ctx=document) => ctx.querySelector(sel);
const state = { allRepos: [], langs: new Set() };

(function initTheme(){
  const saved = localStorage.getItem('theme') || 'dark';
  if(saved === 'light') document.documentElement.classList.add('light');
  $('#themeToggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('light');
    localStorage.setItem('theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
  });
})();

async function fetchUserAndRepos(username){
  const headers = { 'Accept':'application/vnd.github+json' };
  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, {headers}),
    fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {headers})
  ]);
  if(!userRes.ok) throw new Error('User not found');
  const user = await userRes.json();
  const repos = (await reposRes.json()).filter(r => !r.fork);
  return {user, repos};
}

function fillProfile(user){
  $('#name').textContent = user.name || user.login;
  $('#bio').textContent = user.bio || '—';
  $('#avatar').src = user.avatar_url || 'assets/avatar-placeholder.svg';
  $('#githubLink').href = user.html_url;
  $('#githubLink2').href = user.html_url;
  if(user.blog){ $('#linkedinLink').href = user.blog; $('#linkedinLink2').href = user.blog; $('#linkedinLink').textContent='Website/LinkedIn'; $('#linkedinLink2').textContent=user.blog; }
  if(user.email){ $('#emailLink').href = `mailto:${user.email}`; $('#emailLink').textContent = user.email; $('#emailLink2').href=`mailto:${user.email}`; $('#emailLink2').textContent = user.email; }
}

function renderRepos(repos){
  const wrap = $('#projects'); wrap.innerHTML = '';
  const search = $('#search').value.toLowerCase();
  const lang = $('#langFilter').value;
  const sort = $('#sort').value;

  let list = repos.filter(r => {
    const text = `${r.name} ${r.description||''}`.toLowerCase();
    const matchText = !search || text.includes(search);
    const matchLang = !lang || (r.language===lang);
    return matchText && matchLang;
  });

  if(sort === 'stars') list.sort((a,b) => (b.stargazers_count||0)-(a.stargazers_count||0));
  else if(sort === 'name') list.sort((a,b) => a.name.localeCompare(b.name));
  else list.sort((a,b) => new Date(b.pushed_at) - new Date(a.pushed_at));

  $('#empty').hidden = list.length !== 0;

  for(const r of list){
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${r.name}</h3>
      <p class="muted">${r.description || ''}</p>
      <div class="meta">
        ${r.language ? `<span class="tag">${r.language}</span>` : ''}
        <span class="tag">★ ${r.stargazers_count}</span>
        <span class="tag">Updated: ${new Date(r.pushed_at).toLocaleDateString('en-US')}</span>
      </div>
      <div class="actions">
        <a href="${r.html_url}" target="_blank" rel="noopener">View Code</a>
        ${r.homepage ? `<a href="${r.homepage}" target="_blank" rel="noopener">Demo</a>` : ''}
      </div>
    `;
    wrap.appendChild(card);
  }
}

function fillLangFilter(repos){
  state.langs = new Set(repos.map(r=>r.language).filter(Boolean));
  const sel = $('#langFilter');
  sel.innerHTML = '<option value="">All languages</option>' + Array.from(state.langs).sort().map(l=>`<option>${l}</option>`).join('');
}

$('#loadBtn').addEventListener('click', async () => {
  const username = $('#username').value.trim();
  if(!username) return;
  $('#loadBtn').disabled = true; $('#loadBtn').textContent = 'Loading...';
  try{
    const {user, repos} = await fetchUserAndRepos(username);
    state.allRepos = repos;
    fillProfile(user);
    fillLangFilter(repos);
    renderRepos(repos);
  }catch(e){
    alert('Error: ' + e.message);
  }finally{
    $('#loadBtn').disabled = false; $('#loadBtn').textContent = 'Load Projects';
  }
});

$('#search').addEventListener('input', () => renderRepos(state.allRepos));
$('#langFilter').addEventListener('change', () => renderRepos(state.allRepos));
$('#sort').addEventListener('change', () => renderRepos(state.allRepos));

window.addEventListener('DOMContentLoaded', () => {
  const u = $('#username').value.trim();
  if(u && u !== 'YOUR_USERNAME'){ $('#loadBtn').click(); }
});
