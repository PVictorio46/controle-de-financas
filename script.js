const tbody = document.querySelector("tbody");
const desc = document.querySelector("#desc");
const amount = document.querySelector("#amount");
const type = document.querySelector("#type");
const hasSubItems = document.querySelector("#hasSubItems");
const incomes = document.querySelector("#incomes");
const expenses = document.querySelector("#expenses");
const total = document.querySelector("#total");
const monthSelect = document.querySelector("#monthSelect");
const reportTitle = document.querySelector("#reportTitle");

const defaultMonths = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
let currentMonth = "";
let items = [];

// Elementos do Modal Customizado
const modalOverlay = document.getElementById('customModal');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const modalInput = document.getElementById('modalInput');
const btnCancel = document.getElementById('modalBtnCancel');
const btnConfirm = document.getElementById('modalBtnConfirm');

// === FUNÇÃO GLOBAL DO MODAL (Substitui Prompt/Alert/Confirm) ===
window.customModal = function(title, text = "", type = "prompt") {
  return new Promise((resolve) => {
    modalTitle.innerText = title;
    modalText.innerText = text;
    modalInput.value = "";

    if (type === "prompt") {
      modalInput.classList.remove("hidden");
      btnCancel.classList.remove("hidden");
      setTimeout(() => modalInput.focus(), 100);
    } else if (type === "confirm") {
      modalInput.classList.add("hidden");
      btnCancel.classList.remove("hidden");
    } else if (type === "alert") {
      modalInput.classList.add("hidden");
      btnCancel.classList.add("hidden");
    }

    modalOverlay.classList.remove("hidden");

    const handleConfirm = () => { cleanup(); resolve(type === "prompt" ? modalInput.value : true); };
    const handleCancel = () => { cleanup(); resolve(type === "prompt" ? null : false); };
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') handleConfirm();
      if (e.key === 'Escape') handleCancel();
    };

    const cleanup = () => {
      modalOverlay.classList.add("hidden");
      btnConfirm.removeEventListener("click", handleConfirm);
      btnCancel.removeEventListener("click", handleCancel);
      modalInput.removeEventListener("keydown", handleKeyPress);
    };

    btnConfirm.addEventListener("click", handleConfirm);
    btnCancel.addEventListener("click", handleCancel);
    modalInput.addEventListener("keydown", handleKeyPress);
  });
};

function getCustomMonths() { return JSON.parse(localStorage.getItem("customMonths")) ?? []; }
function setCustomMonths(list) { localStorage.setItem("customMonths", JSON.stringify(list)); }

function loadMonthSelect() {
  const customMonths = getCustomMonths();
  const previousMonth = currentMonth; // Salva o mês atual para não perder a seleção
  monthSelect.innerHTML = "";
  
  defaultMonths.forEach(m => { monthSelect.innerHTML += `<option value="${m}">${m}</option>`; });
  
  if (customMonths.length > 0) { monthSelect.innerHTML += `<option disabled>──────────</option>`; }
  
  customMonths.forEach(m => { monthSelect.innerHTML += `<option value="${m}">${m}</option>`; });
  
  monthSelect.innerHTML += `<option value="__create__">➕ Criar Outro</option>`;
  monthSelect.innerHTML += `<option value="__delete__">❌ Excluir atual</option>`;

  const allMonths = [...defaultMonths, ...customMonths];
  if (previousMonth && allMonths.includes(previousMonth)) {
    monthSelect.value = previousMonth;
  } else {
    monthSelect.selectedIndex = new Date().getMonth();
  }
  
  currentMonth = monthSelect.value;
}

monthSelect.addEventListener("change", async () => {
  if (monthSelect.value === "__create__") {
    const name = await customModal("Nova Aba", "Digite o nome do novo mês/aba:", "prompt");
    if (!name) { loadMonthSelect(); return; }
    
    let customMonths = getCustomMonths();
    if (customMonths.includes(name) || defaultMonths.includes(name)) {
      await customModal("Aviso", "Esse nome já existe!", "alert");
      loadMonthSelect();
      return;
    }
    
    customMonths.push(name);
    setCustomMonths(customMonths);
    currentMonth = name;
    loadMonthSelect();
    monthSelect.value = name;
    loadItens();
    return;
  }

  if (monthSelect.value === "__delete__") {
    if (defaultMonths.includes(currentMonth)) {
      await customModal("Aviso", "Não pode excluir os meses padrão do sistema!", "alert");
      loadMonthSelect();
      return;
    }
    const confirmDelete = await customModal("Excluir", `Tem certeza que deseja excluir "${currentMonth}"?`, "confirm");
    if (!confirmDelete) { loadMonthSelect(); return; }
    
    let customMonths = getCustomMonths();
    customMonths = customMonths.filter(m => m !== currentMonth);
    setCustomMonths(customMonths);
    localStorage.removeItem(`financas_${currentMonth}`);
    
    currentMonth = defaultMonths[new Date().getMonth()];
    loadMonthSelect();
    loadItens();
    return;
  }
 
  currentMonth = monthSelect.value;
  loadItens();
});

hasSubItems.addEventListener("change", () => {
  if (hasSubItems.checked) {
    amount.value = ""; amount.disabled = true; amount.placeholder = "Automático";
  } else {
    amount.disabled = false; amount.placeholder = "R$ 0,00";
  }
});

amount.addEventListener("input", () => {
  let value = amount.value.replace(/\D/g, "");
  value = (value / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  amount.value = value;
});

// Parser inteligente e seguro para valores digitados em inputs de texto livres
function parseInputValue(str) {
  if (!str) return 0;
  str = str.trim().replace(/[R$\s]/g, "");
  
  if (str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else {
    const parts = str.split(".");
    if (parts.length === 2 && parts[1].length === 3) {
      str = str.replace(/\./g, "");
    }
  }
  return Number(str) || 0;
}

document.querySelector("#btnNew").onclick = async () => {
  if (desc.value === "" || (!hasSubItems.checked && amount.value === "")) {
    await customModal("Aviso", "Preencha os campos (Nome e/ou Valor)", "alert");
    return;
  }

  let numericValue = 0;
  if (!hasSubItems.checked) {
    numericValue = parseInputValue(amount.value);
  }

  items.push({
    desc: desc.value,
    amount: numericValue,
    type: type.value,
    hasSubItems: hasSubItems.checked,
    subItems: [],
    isExpanded: true
  });

  setItensBD();
  loadItens();

  desc.value = ""; amount.value = ""; hasSubItems.checked = false;
  amount.disabled = false; amount.placeholder = "R$ 0,00";
};

function getKey() { return `financas_${currentMonth}`; }
function getItensBD() { return JSON.parse(localStorage.getItem(getKey())) ?? []; }
function setItensBD() { localStorage.setItem(getKey(), JSON.stringify(items)); }

function loadItens() {
  items = getItensBD();
  tbody.innerHTML = "";
  items.forEach((item, index) => {
    if (item.hasSubItems) { 
      item.amount = (item.subItems || []).reduce((acc, sub) => acc + sub.amount, 0); 
    }
    insertItem(item, index);
  });
  setItensBD(); // Sincroniza os totais recalculados no localStorage
  getTotals();
  reportTitle.innerText = `Relatório - ${currentMonth}`;
}

function insertItem(item, index) {
  let tr = document.createElement("tr");
  let descHtml = "";
  
  if (item.hasSubItems) {
    if (item.isExpanded === undefined) item.isExpanded = true;
    const toggleIcon = item.isExpanded ? "bx-chevron-up" : "bx-chevron-down";
    descHtml += `<i class="bx ${toggleIcon} btn-toggle" onclick="toggleExpand(${index})"></i> `;
    descHtml += item.desc;
    descHtml += ` <button class="btn-add-sub" onclick="addSubItem(${index})">+ Sub-item</button>`;
  } else {
    descHtml = item.desc;
  }

  tr.innerHTML = `
    <td>${descHtml}</td>
    <td>${formatCurrency(item.amount)}</td>
    <td>${item.type === "Entrada" ? '<i class="bx bxs-chevron-up-circle" style="color:#00e676"></i>' : '<i class="bx bxs-chevron-down-circle" style="color:#ff5252"></i>'}</td>
    <td><i class="bx bx-trash" onclick="deleteItem(${index})"></i></td>
  `;
  tbody.appendChild(tr);

  if (item.hasSubItems && item.subItems && item.isExpanded) {
    item.subItems.forEach((sub, subIndex) => {
      let subTr = document.createElement("tr");
      subTr.className = "sub-item";
      subTr.innerHTML = `
        <td>${sub.desc}</td>
        <td>${formatCurrency(sub.amount)}</td>
        <td></td>
        <td><i class="bx bx-trash" onclick="deleteSubItem(${index}, ${subIndex})"></i></td>
      `;
      tbody.appendChild(subTr);
    });
  }
}

window.toggleExpand = (index) => {
  items[index].isExpanded = !items[index].isExpanded;
  setItensBD();
  loadItens();
};

window.addSubItem = async (index) => {
  const subDesc = await customModal("Novo Sub-item", "Qual a descrição do gasto?", "prompt");
  if (!subDesc) return;
  
  let subAmountStr = await customModal("Valor", `Qual o valor de "${subDesc}"? (ex: 150,50)`, "prompt");
  if (!subAmountStr) return;
  
  let parsedAmount = parseInputValue(subAmountStr);
  
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    await customModal("Erro", "O valor digitado é inválido!", "alert");
    return;
  }

  if (!items[index].subItems) items[index].subItems = [];
  items[index].subItems.push({ desc: subDesc, amount: parsedAmount });
  items[index].isExpanded = true; 
  setItensBD(); 
  loadItens();
};

window.deleteSubItem = async (itemIndex, subIndex) => {
  const confirmDel = await customModal("Excluir", "Deseja mesmo excluir este sub-item?", "confirm");
  if (confirmDel) {
    items[itemIndex].subItems.splice(subIndex, 1);
    setItensBD(); 
    loadItens();
  }
};

window.deleteItem = async (index) => {
  const confirmDel = await customModal("Excluir", "Excluir este item? (Sub-itens também serão apagados)", "confirm");
  if(confirmDel) {
    items.splice(index, 1);
    setItensBD(); 
    loadItens();
  }
};

function getTotals() {
  const totalIncomes = items.filter(i => i.type === "Entrada").reduce((acc, i) => acc + i.amount, 0);
  const totalExpenses = items.filter(i => i.type === "Saída").reduce((acc, i) => acc + i.amount, 0);
  incomes.textContent = formatCurrency(totalIncomes);
  expenses.textContent = formatCurrency(totalExpenses);
  total.textContent = formatCurrency(totalIncomes - totalExpenses);
}

function formatCurrency(value) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

window.copyFromMonth = async () => {
  const customMonths = getCustomMonths();
  const allMonths = [...defaultMonths, ...customMonths];
  
  const sourceMonthStr = await customModal("Copiar Relatório", `Digite o NOME DO MÊS de onde deseja copiar:\n\n(${allMonths.join(", ")})`, "prompt");
  if (!sourceMonthStr) return;
  
  const sourceMonth = allMonths.find(m => m.toLowerCase() === sourceMonthStr.toLowerCase().trim());
  
  if (!sourceMonth) {
      await customModal("Erro", "Mês não encontrado. Verifique a ortografia.", "alert"); return;
  }
  if (sourceMonth === currentMonth) {
      await customModal("Aviso", "Você não pode copiar para o mesmo mês aberto.", "alert"); return;
  }
  
  const sourceData = JSON.parse(localStorage.getItem(`financas_${sourceMonth}`)) ?? [];
  
  if (sourceData.length === 0) {
      await customModal("Aviso", `Não há dados em ${sourceMonth} para copiar.`, "alert"); return;
  }
  
  const confirmCopy = await customModal("Confirmar", `Encontrados ${sourceData.length} itens em ${sourceMonth}.\nDeseja adicionar eles em ${currentMonth}?`, "confirm");
  if (confirmCopy) {
      items = [...items, ...sourceData];
      setItensBD(); 
      loadItens();
      await customModal("Sucesso", `Dados de ${sourceMonth} copiados!`, "alert");
  }
};

function printReport() { window.print(); }

loadMonthSelect(); 
loadItens();