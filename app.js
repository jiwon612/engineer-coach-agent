// ===== 엔지니어 학습 코치 Agent =====
// API 키는 localStorage에만 저장되고, 브라우저에서 직접 LLM API로 전송됩니다.
// 이 서버(GitHub Pages)는 키를 보거나 저장하지 않는 순수 정적 사이트입니다.

const MODELS = {
  anthropic: [
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (추천)" },
    { id: "claude-opus-4-8", label: "Claude Opus 4.8 (고성능)" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (빠름)" },
  ],
  openai: [
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o mini (빠름)" },
  ],
};

const MODE_META = {
  algo: {
    title: "🧩 알고리즘 문제 풀이 도우미",
    sub: "문제를 붙여넣으면 단계적으로 힌트를 드려요. 힌트 강도에 따라 답을 바로 주지 않고 스스로 생각하는 과정을 돕습니다.",
    placeholder: "문제 설명, 입출력 예시, (선택) 작성 중인 코드를 붙여넣어 주세요...",
    examples: [
      "백준 1차원 배열 두 수의 합(Two Sum) 문제를 어떻게 접근해야 할지 모르겠어요",
      "이 DFS 코드가 시간초과가 나는데 왜 그런지 모르겠어요",
      "다이나믹 프로그래밍이랑 그리디는 어떻게 구분해서 접근해야 하나요?",
    ],
  },
  concept: {
    title: "📘 CS 개념 설명",
    sub: "자료구조, 알고리즘, 운영체제, 네트워크 등 개념을 난이도에 맞춰 비유와 예시로 설명해 드려요.",
    placeholder: "궁금한 개념을 질문해 주세요. 예: 해시 테이블의 충돌 처리 방식이 궁금해요",
    examples: [
      "시간 복잡도 O(n log n)이 직관적으로 무슨 의미인가요?",
      "재귀와 반복문의 트레이드오프를 실무 예시로 설명해 주세요",
      "B+Tree와 해시 인덱스는 언제 각각 써야 하나요?",
    ],
  },
  review: {
    title: "🔍 코드 리뷰",
    sub: "코드를 붙여넣으면 가독성, 효율성, 잠재적 버그, 더 나은 패턴을 짚어 드려요.",
    placeholder: "리뷰받고 싶은 코드를 붙여넣어 주세요 (언어를 함께 알려주시면 더 정확해요)",
    examples: [
      "이 정렬 함수 코드 리뷰해 주세요 (Python)",
      "재귀로 짠 피보나치 함수를 메모이제이션으로 개선하고 싶어요",
      "이 API 호출 코드에서 에러 처리가 충분한지 봐주세요",
    ],
  },
};

const SYSTEM_PROMPTS = {
  algo: (level, hint) => `너는 신입 엔지니어를 위한 알고리즘 학습 코치다. 사용자의 알고리즘 문제 풀이를 돕는다.
난이도 설정: ${level}. 힌트 강도 설정: ${hint}.
- "살짝 힌트": 정답을 절대 알려주지 말고, 어떤 자료구조/접근법을 고민해봐야 하는지 1~2문장으로만 질문 형태의 힌트를 줘라.
- "방향 제시": 전체 알고리즘의 큰 그림(접근 전략, 시간복잡도 목표)은 설명하되, 실제 코드는 작성하지 마라. 핵심 아이디어를 단계별로 안내해라.
- "정답까지": 풀이 전략과 함께 동작하는 코드 예시까지 제공하고, 왜 그렇게 동작하는지 설명해라.
항상 소크라테스식으로 사용자가 스스로 생각하게 유도하는 질문을 1개 이상 포함해라. 답변은 한국어로, 마크다운과 코드블록을 활용해라.`,
  concept: (level) => `너는 신입 엔지니어를 위한 CS 개념 설명 코치다. 난이도 설정: ${level}.
- 초급: 비유와 일상적인 예시를 적극 사용하고 전문 용어는 풀어서 설명해라.
- 중급: 핵심 동작 원리와 실무에서의 활용 예시를 함께 설명해라.
- 고급: 트레이드오프, 내부 구현 디테일, 관련 자료구조/알고리즘과의 비교까지 깊이 있게 설명해라.
설명 끝에는 "더 깊이 알아보면 좋은 것" 1가지를 짧게 제안해라. 한국어로, 마크다운을 활용해 구조적으로 답변해라.`,
  review: (level) => `너는 신입 엔지니어를 위한 코드 리뷰어다. 난이도 설정: ${level}에 맞춰 설명의 깊이를 조절해라.
다음 관점에서 코드를 리뷰해라: (1) 가독성/네이밍, (2) 효율성(시간/공간 복잡도), (3) 잠재적 버그/엣지케이스, (4) 더 나은 패턴/관용구.
각 항목은 짧고 구체적으로, 개선이 필요한 부분은 수정된 코드 스니펫과 함께 제시해라. 잘 작성된 부분이 있다면 칭찬도 짧게 포함해라. 한국어로 답변해라.`,
};

const state = {
  mode: "algo",
  level: "intermediate",
  hint: 1,
  provider: localStorage.getItem("coach_provider") || "anthropic",
  model: localStorage.getItem("coach_model") || "",
  apiKey: localStorage.getItem("coach_apikey") || "",
  history: [], // {role, content}
};

const els = {
  chat: document.getElementById("chat"),
  emptyState: document.getElementById("emptyState"),
  examples: document.getElementById("examples"),
  composerForm: document.getElementById("composerForm"),
  userInput: document.getElementById("userInput"),
  sendBtn: document.getElementById("sendBtn"),
  topbarTitle: document.getElementById("topbarTitle"),
  topbarSub: document.getElementById("topbarSub"),
  newChatBtn: document.getElementById("newChatBtn"),
  levelSelect: document.getElementById("levelSelect"),
  hintLevels: document.getElementById("hintLevels"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsModal: document.getElementById("settingsModal"),
  providerSelect: document.getElementById("providerSelect"),
  modelSelect: document.getElementById("modelSelect"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  saveKeyBtn: document.getElementById("saveKeyBtn"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  statusBadge: document.getElementById("statusBadge"),
};

function renderModeUI() {
  const meta = MODE_META[state.mode];
  els.topbarTitle.textContent = meta.title;
  els.topbarSub.textContent = meta.sub;
  els.userInput.placeholder = meta.placeholder;
  els.examples.innerHTML = "";
  meta.examples.forEach((ex) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "example-chip";
    chip.textContent = ex;
    chip.onclick = () => { els.userInput.value = ex; els.userInput.focus(); };
    els.examples.appendChild(chip);
  });
  document.querySelectorAll(".mode-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === state.mode);
  });
  document.getElementById("hintLevels").parentElement.style.display =
    state.mode === "algo" ? "" : "none";
}

document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.mode = btn.dataset.mode;
    renderModeUI();
  });
});

document.querySelectorAll(".hint-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.hint = Number(btn.dataset.level);
    document.querySelectorAll(".hint-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

els.levelSelect.addEventListener("change", () => { state.level = els.levelSelect.value; });

els.newChatBtn.addEventListener("click", () => {
  state.history = [];
  els.chat.querySelectorAll(".msg").forEach((m) => m.remove());
  els.emptyState.style.display = "";
});

function hintLabel(n) {
  return { 1: "살짝 힌트", 2: "방향 제시", 3: "정답까지" }[n];
}

function buildSystemPrompt() {
  if (state.mode === "algo") return SYSTEM_PROMPTS.algo(state.level, hintLabel(state.hint));
  return SYSTEM_PROMPTS[state.mode](state.level);
}

function addMessage(role, content, { isError = false, streaming = false } = {}) {
  els.emptyState.style.display = "none";
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;
  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = role === "user" ? "🙋" : "🤖";
  const bubble = document.createElement("div");
  bubble.className = `msg-bubble${isError ? " error" : ""}`;
  if (streaming) {
    bubble.innerHTML = `<span class="typing"><span></span><span></span><span></span></span>`;
  } else {
    bubble.innerHTML = marked.parse(content);
  }
  wrap.appendChild(avatar);
  wrap.appendChild(bubble);
  els.chat.appendChild(wrap);
  els.chat.scrollTop = els.chat.scrollHeight;
  return bubble;
}

function renderMarkdownInto(bubble, content) {
  bubble.innerHTML = marked.parse(content);
  bubble.querySelectorAll("pre code").forEach((block) => hljs.highlightElement(block));
  els.chat.scrollTop = els.chat.scrollHeight;
}

async function callAnthropic(messages, system) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": state.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: state.model || MODELS.anthropic[0].id,
      max_tokens: 2000,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API 오류 (${res.status}): ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.content.map((c) => c.text).join("\n");
}

async function callOpenAI(messages, system) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${state.apiKey}`,
    },
    body: JSON.stringify({
      model: state.model || MODELS.openai[0].id,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API 오류 (${res.status}): ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

els.composerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = els.userInput.value.trim();
  if (!text) return;

  if (!state.apiKey) {
    openModal();
    return;
  }

  els.userInput.value = "";
  addMessage("user", text);
  state.history.push({ role: "user", content: text });

  els.sendBtn.disabled = true;
  const bubble = addMessage("assistant", "", { streaming: true });

  try {
    const system = buildSystemPrompt();
    const reply = state.provider === "anthropic"
      ? await callAnthropic(state.history, system)
      : await callOpenAI(state.history, system);
    state.history.push({ role: "assistant", content: reply });
    renderMarkdownInto(bubble, reply);
  } catch (err) {
    bubble.parentElement.querySelector(".msg-bubble").classList.add("error");
    renderMarkdownInto(bubble, `⚠️ ${err.message}`);
  } finally {
    els.sendBtn.disabled = false;
  }
});

els.userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    els.composerForm.requestSubmit();
  }
});

// ===== Settings modal =====
function populateModelOptions() {
  els.modelSelect.innerHTML = "";
  MODELS[state.provider].forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.label;
    els.modelSelect.appendChild(opt);
  });
  if (state.model) els.modelSelect.value = state.model;
}

function openModal() {
  els.providerSelect.value = state.provider;
  populateModelOptions();
  els.apiKeyInput.value = state.apiKey;
  els.settingsModal.classList.add("open");
}
function closeModal() { els.settingsModal.classList.remove("open"); }

els.settingsBtn.addEventListener("click", openModal);
els.closeModalBtn.addEventListener("click", closeModal);
els.providerSelect.addEventListener("change", () => {
  state.provider = els.providerSelect.value;
  state.model = "";
  populateModelOptions();
});

els.saveKeyBtn.addEventListener("click", () => {
  state.provider = els.providerSelect.value;
  state.model = els.modelSelect.value;
  state.apiKey = els.apiKeyInput.value.trim();
  localStorage.setItem("coach_provider", state.provider);
  localStorage.setItem("coach_model", state.model);
  localStorage.setItem("coach_apikey", state.apiKey);
  updateStatusBadge();
  closeModal();
});

function updateStatusBadge() {
  if (state.apiKey) {
    els.statusBadge.textContent = `✓ ${state.provider === "anthropic" ? "Claude" : "OpenAI"} 연결됨`;
    els.statusBadge.classList.add("ok");
  } else {
    els.statusBadge.textContent = "키 미설정";
    els.statusBadge.classList.remove("ok");
  }
}

// ===== init =====
renderModeUI();
updateStatusBadge();
if (!state.apiKey) {
  setTimeout(openModal, 400);
}
