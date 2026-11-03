// VYBE — configuração da votação
// Para ativar a votação compartilhada, preencha os dois valores abaixo
// com as credenciais públicas do projeto Supabase.
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

const products = [
  { id: "camiseta", name: "Camiseta básica" },
  { id: "tenis", name: "Tênis casual" },
  { id: "bolsa", name: "Bolsa compacta" },
  { id: "bone", name: "Boné clássico" }
];

const statusEl = document.querySelector("#vote-status");
const resultsPanel = document.querySelector("#results-panel");
const resultsList = document.querySelector("#results-list");
const totalEl = document.querySelector("#vote-total");
const footnoteEl = document.querySelector("#results-footnote");
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
const db = supabaseReady
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function getLocalVotes() {
  try {
    return JSON.parse(localStorage.getItem("vybe-votes") || "[]");
  } catch {
    return [];
  }
}

function saveLocalVote(productId) {
  const votes = getLocalVotes();
  votes.push({ product_id: productId });
  localStorage.setItem("vybe-votes", JSON.stringify(votes));
}

function summarize(votes) {
  return products.map(product => ({
    ...product,
    count: votes.filter(vote => vote.product_id === product.id).length
  }));
}

function renderResults(votes) {
  const summary = summarize(votes);
  const total = votes.length;
  totalEl.textContent = `${total} ${total === 1 ? "voto" : "votos"}`;
  resultsList.innerHTML = "";

  summary.forEach(item => {
    const percentage = total ? Math.round((item.count / total) * 100) : 0;
    const row = document.createElement("div");
    row.className = "result-row";
    const name = document.createElement("span");
    name.textContent = item.name;
    const track = document.createElement("div");
    track.className = "result-track";
    const fill = document.createElement("div");
    fill.className = "result-fill";
    fill.style.width = `${percentage}%`;
    track.appendChild(fill);
    const count = document.createElement("span");
    count.className = "result-count";
    count.textContent = `${percentage}%`;
    row.append(name, track, count);
    resultsList.appendChild(row);
  });

  resultsPanel.hidden = false;
  footnoteEl.textContent = supabaseReady
    ? "Resultados agregados dos participantes que votaram neste projeto."
    : "Modo demonstração: estes votos ficam salvos apenas neste navegador. Configure o Supabase para compartilhar entre celulares.";
}

async function loadVotes() {
  if (!db) {
    renderResults(getLocalVotes());
    return;
  }
  const { data, error } = await db.from("votes").select("product_id");
  if (error) {
    console.error("Não foi possível carregar os votos:", error.message);
    statusEl.textContent = "Não foi possível carregar a votação compartilhada. Confira a configuração do Supabase.";
    return;
  }
  renderResults(data || []);
}

async function castVote(productId, button) {
  const alreadyVoted = localStorage.getItem("vybe-voted");
  if (alreadyVoted) {
    statusEl.textContent = "Você já registrou sua escolha neste navegador. Obrigado por participar!";
    return;
  }

  button.disabled = true;
  statusEl.textContent = "Registrando sua escolha…";

  if (db) {
    const { error } = await db.from("votes").insert({ product_id: productId });
    if (error) {
      console.error("Erro ao registrar voto:", error.message);
      statusEl.textContent = "Não foi possível registrar seu voto. Tente novamente em instantes.";
      button.disabled = false;
      return;
    }
  } else {
    saveLocalVote(productId);
  }

  localStorage.setItem("vybe-voted", "true");
  document.querySelectorAll(".vote-button").forEach(item => {
    item.classList.toggle("selected", item.dataset.vote === productId);
    item.disabled = true;
  });
  statusEl.textContent = "Voto registrado! Obrigado por participar da experiência VYBE.";
  await loadVotes();
}

document.querySelectorAll(".vote-button").forEach(button => {
  button.addEventListener("click", () => castVote(button.dataset.vote, button));
});

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
mainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

// Links do vídeo e do Kahoot: substitua pelos endereços finais do projeto.
const VIDEO_URL = "";
const KAHOOT_URL = "";
if (VIDEO_URL) document.querySelector("#video-link").href = VIDEO_URL;
if (KAHOOT_URL) document.querySelector("#quiz-link").href = KAHOOT_URL;

loadVotes();
