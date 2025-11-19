// CONFIGURAÇÃO
// ID fornecido pelo usuário
const SPREADSHEET_ID = "13MKp7Cu9-p1cDRTdCtBVLElZuOko3465MD5cb2O9nqg";
const SHEET_NAME = "BD";

function doGet(e) {
  return handleRequest(e, "GET");
}

function doPost(e) {
  return handleRequest(e, "POST");
}

function handleRequest(e, method) {
  const params = e.parameter || {}; // Garante que params existe
  getScriptLock(); 

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error(`Aba ${SHEET_NAME} não encontrada.`);
    }

    // ======================================================
    // Rota GET: Buscar dados
    // ======================================================
    if (method === "GET") {

      // AÇÃO 1: Buscar último link (Lógica Corrigida)
      if (params.action && params.action === "lastLink") {
        const lastRow = sheet.getLastRow();

        if (lastRow <= 1) {
          return responseJson({ status: "success", result: null });
        }

        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        
        // FIX ZERO-BUG: Procura por 'linkPagamento' OU 'Link'
        const colLinkIndex = headers.findIndex(h => {
          const header = h.toString().trim().toLowerCase();
          return header === "linkpagamento" || header === "link";
        });

        if (colLinkIndex === -1) {
          // Se não achar, lista as colunas para ajudar no debug
          throw new Error(`Coluna 'linkPagamento' não encontrada. Cabeçalhos atuais: ${headers.join(", ")}`);
        }

        const lastLink = sheet.getRange(lastRow, colLinkIndex + 1).getValue();

        return responseJson({
          status: "success",
          result: lastLink
        });
      }

      // AÇÃO 2: Buscar dados pelo ID
      const id = params.id;

      if (!id) {
        throw new Error("Parâmetro 'id' ausente na URL.");
      }

      const allData = sheet.getDataRange().getValues();
      const headers = allData.shift(); 
      
      // Procura índice do ID
      const idIndex = headers.findIndex(h => h.toString().trim().toLowerCase() === "id");

      if (idIndex === -1) {
        throw new Error("Coluna 'id' não encontrada na planilha.");
      }

      // Busca segura (converte ambos para string para evitar erro de tipo)
      const row = allData.find(r => String(r[idIndex]) === String(id));

      if (!row) {
        throw new Error(`Pedido não encontrado.`);
      }

      const result = {};
      for (let i = 0; i < headers.length; i++) {
        result[headers[i]] = row[i];
      }

      return responseJson({
        status: "success",
        data: result // Padronizado para 'data' para bater com seu frontend
      });
    }

    // ======================================================
    // Rota POST: Inserir dados (Mantido do anterior)
    // ======================================================
    if (method === "POST") {
      let postData;
      if (e.postData && e.postData.contents) {
        try { postData = JSON.parse(e.postData.contents); } 
        catch (err) { postData = params; }
      } else {
        postData = params;
      }

      if (!postData || Object.keys(postData).length === 0) {
        return responseJson({ status: "error", message: "Nenhum dado recebido." });
      }

      const headersRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
      const headers = headersRange.getValues()[0];
      let generatedId = null;

      const newRow = headers.map(header => {
        const key = header.toString().trim();
        // Se for ID e estiver vazio, gera um novo
        if (key.toLowerCase() === 'id') {
           if (postData[key]) return postData[key];
           generatedId = Utilities.getUuid();
           return generatedId;
        }
        // Mapeia o dado recebido para a coluna correta
        return postData[key] !== undefined ? postData[key] : ""; 
      });

      sheet.appendRow(newRow);

      return responseJson({
        status: "success",
        message: "Dados salvos com sucesso.",
        savedId: generatedId || postData['id']
      });
    }

    throw new Error(`Método ${method} não suportado.`);

  } catch (error) {
    return responseJson({
      status: "error",
      message: error.message
    });
  } finally {
    releaseScriptLock();
  }
}

// Funções utilitárias
function responseJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getScriptLock() {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
}

function releaseScriptLock() {
  try { LockService.getScriptLock().releaseLock(); } catch (e) {}
}
