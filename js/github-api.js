// GitHub REST API wrapper — read/write JSON files in the configured repo

const GH = (() => {
  const BASE = 'https://api.github.com';

  function cfg() {
    const token = localStorage.getItem('gh_token');
    const owner = localStorage.getItem('gh_owner');
    const repo  = localStorage.getItem('gh_repo');
    if (!token || !owner || !repo) throw new Error('GitHub not configured — go to Settings');
    return { token, owner, repo };
  }

  async function request(method, path, body) {
    const { token, owner, repo } = cfg();
    const url = `${BASE}/repos/${owner}/${repo}/contents/${path}`;
    const opts = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if (!res.ok) {
      if (res.status === 404) return null;
      const txt = await res.text().catch(() => '');
      throw new Error(`GitHub ${method} ${path} → ${res.status}: ${txt}`);
    }
    if (method === 'DELETE') return null;
    return res.json();
  }

  // Returns parsed JSON object, or null if file doesn't exist
  async function readJSON(path) {
    const data = await request('GET', path);
    if (!data) return null;
    const json = JSON.parse(atob(data.content.replace(/\n/g, '')));
    return { data: json, sha: data.sha };
  }

  // Writes (creates or updates) a JSON file. sha required to update existing.
  async function writeJSON(path, obj, sha, message) {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(obj, null, 2))));
    const body = {
      message: message || `update ${path}`,
      content,
    };
    if (sha) body.sha = sha;
    return request('PUT', path, body);
  }

  // High-level: load existing, merge/replace, save back
  async function upsertJSON(path, obj, message) {
    const existing = await readJSON(path);
    return writeJSON(path, obj, existing?.sha, message);
  }

  async function deleteFile(path, sha, message) {
    const { token, owner, repo } = cfg();
    const url = `${BASE}/repos/${owner}/${repo}/contents/${path}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: message || `delete ${path}`, sha }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`GitHub DELETE ${path} → ${res.status}: ${txt}`);
    }
  }

  // List files in a directory (returns [] if directory doesn't exist)
  async function listDir(path) {
    const { token, owner, repo } = cfg();
    const url = `${BASE}/repos/${owner}/${repo}/contents/${path}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (res.status === 404) return [];
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  function isConfigured() {
    return !!(localStorage.getItem('gh_token') &&
              localStorage.getItem('gh_owner') &&
              localStorage.getItem('gh_repo'));
  }

  return { readJSON, writeJSON, upsertJSON, deleteFile, listDir, isConfigured };
})();
