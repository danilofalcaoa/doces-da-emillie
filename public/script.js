const BOX_PRICE = 8;
const WHATSAPP_NUMBER = "554299080901";

const flavors = [
  {
    id: "brigadeiro",
    name: "Brigadeiro",
    image: "./assets/brigadeiro.png",
    description: "Chocolate com acabamento de granulado.",
    ingredients: "Leite condensado, chocolate 50%, creme de leite, manteiga e granulado."
  },
  {
    id: "prestigio",
    name: "Prestigio",
    image: "./assets/prestigio.png",
    description: "Chocolate com coco em uma combinacao classica.",
    ingredients: "Leite condensado, chocolate 50%, coco ralado, creme de leite e manteiga."
  },
  {
    id: "beijinho",
    name: "Beijinho",
    image: "./assets/beijinho.png",
    description: "Doce branco com coco e sabor caseiro.",
    ingredients: "Leite condensado, coco ralado, creme de leite, manteiga e acucar cristal."
  },
  {
    id: "ninho",
    name: "Ninho",
    image: "./assets/ninho.png",
    description: "Leite ninho claro, suave e cremoso.",
    ingredients: "Leite condensado, leite em po, creme de leite, manteiga e leite em po para finalizar."
  }
];

const state = {
  boxCount: 1,
  mode: "same",
  boxes: [createEmptyBox()]
};

const flavorGrid = document.querySelector("#flavorGrid");
const boxesPanel = document.querySelector("#boxesPanel");
const boxCountInput = document.querySelector("#boxCount");
const orderTotal = document.querySelector("#orderTotal");
const summaryTotal = document.querySelector("#summaryTotal");
const summaryCount = document.querySelector("#summaryCount");
const summaryList = document.querySelector("#summaryList");
const whatsappButton = document.querySelector("#whatsappButton");
const toast = document.querySelector("#toast");

function createEmptyBox() {
  return flavors.reduce((box, flavor) => {
    box[flavor.id] = 0;
    return box;
  }, {});
}

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getVisibleBoxes() {
  if (state.mode === "same") {
    return [state.boxes[0] || createEmptyBox()];
  }

  return state.boxes.slice(0, state.boxCount);
}

function getOrderBoxes() {
  if (state.mode === "same") {
    return Array.from({ length: state.boxCount }, () => ({ ...state.boxes[0] }));
  }

  return state.boxes.slice(0, state.boxCount).map((box) => ({ ...box }));
}

function getBoxTotal(box) {
  return Object.values(box).reduce((sum, quantity) => sum + quantity, 0);
}

function getFlavorQuantityText(box) {
  return flavors
    .filter((flavor) => box[flavor.id] > 0)
    .map((flavor) => `${box[flavor.id]}x ${flavor.name}`)
    .join(", ");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3400);
}

function ensureBoxCount() {
  state.boxes = state.boxes.slice(0, state.boxCount);
  while (state.boxes.length < state.boxCount) {
    state.boxes.push(createEmptyBox());
  }
}

function renderFlavorCards() {
  flavorGrid.innerHTML = flavors
    .map(
      (flavor) => `
        <article class="flavor-card">
          <img src="${flavor.image}" alt="${flavor.name}" />
          <h3>${flavor.name}</h3>
          <p>${flavor.ingredients}</p>
        </article>
      `
    )
    .join("");
}

function renderBoxes() {
  const visibleBoxes = getVisibleBoxes();

  boxesPanel.innerHTML = visibleBoxes
    .map((box, index) => {
      const total = getBoxTotal(box);
      const title = state.mode === "same" ? "Caixa modelo" : `Caixa ${index + 1}`;
      const subtitle =
        state.mode === "same" && state.boxCount > 1
          ? `Sera repetida em ${state.boxCount} caixas`
          : "Escolha ate 4 doces";

      return `
        <article class="box-builder" data-box-index="${index}">
          <header>
            <div>
              <h3>${title}</h3>
              <span>${subtitle}</span>
            </div>
            <div class="slots" aria-label="${total} de 4 doces escolhidos">
              ${Array.from({ length: 4 }, (_, slot) => `<span class="slot ${slot < total ? "filled" : ""}"></span>`).join("")}
            </div>
          </header>
          <div class="flavor-picker">
            ${flavors
              .map(
                (flavor) => `
                  <div class="picker-row">
                    <img src="${flavor.image}" alt="" />
                    <div>
                      <strong>${flavor.name}</strong>
                      <small>${flavor.description}</small>
                    </div>
                    <div class="stepper" aria-label="Quantidade de ${flavor.name}">
                      <button type="button" data-action="decrease" data-box="${index}" data-flavor="${flavor.id}">-</button>
                      <span>${box[flavor.id]}</span>
                      <button type="button" data-action="increase" data-box="${index}" data-flavor="${flavor.id}">+</button>
                    </div>
                  </div>
                `
              )
              .join("")}
          </div>
          ${total !== 4 ? `<p class="box-warning">Faltam ${4 - total} doce(s) para fechar esta caixa.</p>` : ""}
        </article>
      `;
    })
    .join("");
}

function renderSummary() {
  const boxes = getOrderBoxes();
  const total = state.boxCount * BOX_PRICE;
  const label = state.boxCount === 1 ? "1 caixa" : `${state.boxCount} caixas`;

  orderTotal.textContent = formatCurrency(total);
  summaryTotal.textContent = formatCurrency(total);
  summaryCount.textContent = label;

  if (state.mode === "same") {
    const text = getFlavorQuantityText(boxes[0]) || "Ainda nao preenchida";
    summaryList.innerHTML = `
      <div class="summary-item">
        <strong>${label} iguais</strong>
        <span>${text}</span>
      </div>
    `;
    return;
  }

  summaryList.innerHTML = boxes
    .map(
      (box, index) => `
        <div class="summary-item">
          <strong>Caixa ${index + 1}</strong>
          <span>${getFlavorQuantityText(box) || "Ainda nao preenchida"}</span>
        </div>
      `
    )
    .join("");
}

function render() {
  ensureBoxCount();
  renderBoxes();
  renderSummary();
}

function updateQuantity(boxIndex, flavorId, direction) {
  const targetBox = state.mode === "same" ? state.boxes[0] : state.boxes[boxIndex];
  const currentTotal = getBoxTotal(targetBox);

  if (direction === "increase") {
    if (currentTotal >= 4) {
      showToast("Cada caixinha tem limite de 4 doces.");
      return;
    }

    targetBox[flavorId] += 1;
  } else if (targetBox[flavorId] > 0) {
    targetBox[flavorId] -= 1;
  }

  render();
}

function validateOrder() {
  const incompleteIndex = getOrderBoxes().findIndex((box) => getBoxTotal(box) !== 4);

  if (incompleteIndex !== -1) {
    const boxName = state.mode === "same" ? "caixa modelo" : `caixa ${incompleteIndex + 1}`;
    showToast(`Complete a ${boxName} com 4 doces antes de pedir.`);
    return false;
  }

  return true;
}

function buildOrderText() {
  const boxes = getOrderBoxes();
  const lines = [
    "Ola, Emillie! Quero fazer um pedido:",
    "",
    `Quantidade: ${state.boxCount} ${state.boxCount === 1 ? "caixa" : "caixas"}`,
    `Total: ${formatCurrency(state.boxCount * BOX_PRICE)}`,
    ""
  ];

  if (state.mode === "same") {
    lines.push(`Todas iguais: ${getFlavorQuantityText(boxes[0])}`);
  } else {
    boxes.forEach((box, index) => {
      lines.push(`Caixa ${index + 1}: ${getFlavorQuantityText(box)}`);
    });
  }

  return lines.join("\n");
}

function sendOrder() {
  if (!validateOrder()) return;

  const orderText = buildOrderText();
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`;
  window.location.href = whatsappUrl;
}

boxesPanel.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  updateQuantity(Number(button.dataset.box), button.dataset.flavor, button.dataset.action);
});

boxCountInput.addEventListener("input", () => {
  const nextCount = Math.max(1, Math.min(20, Number(boxCountInput.value) || 1));
  state.boxCount = nextCount;
  boxCountInput.value = String(nextCount);
  render();
});

document.querySelectorAll('input[name="boxMode"]').forEach((input) => {
  input.addEventListener("change", () => {
    state.mode = input.value;
    render();
  });
});

whatsappButton.addEventListener("click", sendOrder);

renderFlavorCards();
render();
