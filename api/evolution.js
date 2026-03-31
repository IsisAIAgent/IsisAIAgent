// ============================================
// api/evolution.js v2.3 — Desvio elegante
// Isis responde qualquer assunto com empatia
// e redireciona para suas especialidades
// ============================================
const E = {
  mao:     String.fromCodePoint(0x1F44B),
  lampada: String.fromCodePoint(0x1F4A1),
  foguete: String.fromCodePoint(0x1F680),
  estrela: String.fromCodePoint(0x2728),
  traco:   String.fromCodePoint(0x2014),
  cafe:    String.fromCodePoint(0x2615),
  grafico: String.fromCodePoint(0x1F4C8),
  alvo:    String.fromCodePoint(0x1F3AF),
  fogo:    String.fromCodePoint(0x1F525),
};

// ── Enviar mensagem via Evolution API v2.3.7 ─
async function enviarMensagem(phone, message) {
  const baseUrl  = process.env.EVOLUTION_URL;
  const apiKey   = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  if (!baseUrl || !apiKey || !instance) {
    console.error('❌ Env vars Evolution não configuradas');
    return false;
  }

  const phoneClean = phone.replace(/\D/g, '');

  // ✅ Payload correto para Evolution API v2.3.7
  const payload = {
    number: phoneClean,
    text: message,
    delay: 1200,
    linkPreview: false,
    mentionsEveryOne: false
  };

  console.log('📤 Enviando para Evolution:', JSON.stringify(payload).substring(0, 200));

  try {
    const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify(payload)
    });

    const responseText = await res.text();
    console.log(`📨 Evolution response ${res.status}:`, responseText.substring(0, 300));

    if (!res.ok) {
      console.error('❌ Evolution falhou:', res.status, responseText.substring(0, 200));
      return false;
    }

    console.log('✅ Mensagem enviada com sucesso');
    return true;

  } catch (err) {
    console.error('❌ Evolution erro de rede:', err.message);
    return false;
  }
}

// ── Gerar mensagem Isis via Groq ─────────────
async function gerarMensagemIsis(nome, interesse) {
  const apiKey = process.env.GROQ_API_KEY;
  const h = new Date().getHours();
  const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';

  // Fallback sem Groq
  if (!apiKey) {
    return `${saudacao} ${nome}! ${E.mao}\nSou especialista em marketing digital para empresas de qualquer ramo. Posso te ajudar a vender mais! ${E.grafico}\nBora conversar? ${E.cafe}\n${E.traco} Isis ${E.estrela}`;
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            // ✅ v2.3 — Prompt com desvio elegante e especialidades definidas
            content: `Você é Isis, especialista em marketing digital para empresas de qualquer ramo ou atividade. Responde pelo WhatsApp de forma humana, direta e envolvente.

SUAS ESPECIALIDADES (mencione naturalmente quando relevante):
- Marketing digital para qualquer tipo de negócio
- Automação de atendimento via WhatsApp com IA
- Qualificação e gestão de leads (CRM inteligente)
- Estratégias de vendas e captação de clientes
- Presença digital: redes sociais, tráfego pago, conteúdo

REGRAS OBRIGATÓRIAS:
- Saudação: "${saudacao} [NOME]! ${E.mao}"
- Máximo 4 linhas curtas e diretas
- Tom: leve, humano, brasileiro — NUNCA robótico ou formal
- NUNCA use "Prezado", "Cordialmente", "Atenciosamente"
- CTA leve: "Bora conversar?", "15 minutos bastam!", "Me chama aqui!", "Posso te mostrar como?"
- Assine SEMPRE: "— Isis ${E.estrela}"

QUANDO A MENSAGEM FOR FORA DO CONTEXTO (receitas, política, clima, esporte, etc.):
- NUNCA diga "não sou especialista em X" ou "minha área é outra"
- Acolha com leveza, humor sutil e redirecione com curiosidade
- Conecte o assunto ao seu universo de forma criativa
- Exemplos de desvio elegante:
  * Receita → "Haha, boa pedida! ${E.cafe} Meu cardápio é diferente — sirvo estratégias que fazem empresas venderem mais. Posso te mostrar o menu?"
  * Futebol → "Torcer é ótimo! ${E.fogo} Mas meu campeonato é outro — ajudo empresas a marcar gols de vendas todo dia. Bora jogar junto?"
  * Clima → "Tempo bom é sempre bem-vindo! ${E.estrela} Por falar em boas notícias, ajudo negócios a atrair mais clientes pelo digital. Curiosidade?"
  * Qualquer outro → Acolha com uma frase leve, faça uma analogia criativa com marketing/vendas e convide para conversar`
          },
          {
            role: 'user',
            content: `Nome do lead: ${nome}\nMensagem recebida: ${interesse}`
          }
        ],
        temperature: 0.75,
        max_tokens: 250
      })
    });

    if (!res.ok) throw new Error('Groq HTTP ' + res.status);

    const data = await res.json();
    let msg = data.choices[0].message.content.trim()
      .replace(/Prezado[^\n]*/gi, '')
      .replace(/Cordialmente[^\n]*/gi, '')
      .replace(/Atenciosamente[^\n]*/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Garantir assinatura
    if (!msg.includes('Isis')) msg += `\n${E.traco} Isis ${E.estrela}`;

    return msg;

  } catch (err) {
    console.error('❌ Groq erro:', err.message);
    return `${saudacao} ${nome}! ${E.mao}\nSou especialista em marketing digital para qualquer tipo de negócio. Ajudo empresas a vender mais pelo WhatsApp! ${E.grafico}\nBora conversar? ${E.foguete}\n${E.traco} Isis ${E.estrela}`;
  }
}

// ── Pool PostgreSQL ───────────────────────────
async function getPool() {
  const { Pool } = await import('pg').then(m => m.default || m);
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

// ── Salvar/atualizar lead ────────────────────
async function salvarLead(companyId, nome, phone, interesse) {
  const pool = await getPool();
  try {
    const existing = await pool.query(
      'SELECT id FROM leads WHERE company_id = $1 AND phone = $2 LIMIT 1',
      [companyId, phone]
    );
    if (existing.rows.length > 0) {
      await pool.query('UPDATE leads SET updated_at = NOW() WHERE id = $1', [existing.rows[0].id]);
      console.log('✅ Lead existente:', existing.rows[0].id);
      return existing.rows[0].id;
    }
    const key = Math.random().toString(36).substring(2, 15);
    const result = await pool.query(
      `INSERT INTO leads (company_id, name, phone, interesse, status, temperature, signature_key)
       VALUES ($1, $2, $3, $4, 'novo', 'morno', $5) RETURNING id`,
      [companyId, nome, phone, interesse || 'Contato via WhatsApp', key]
    );
    console.log('✅ Novo lead criado:', result.rows[0].id);
    return result.rows[0].id;
  } finally { await pool.end(); }
}

// ── Salvar mensagem ──────────────────────────
async function salvarMensagem(companyId, leadId, content, direction = 'inbound') {
  const pool = await getPool();
  try {
    await pool.query(
      `INSERT INTO messages (company_id, lead_id, content, direction, sent_by_ai)
       VALUES ($1, $2, $3, $4, $5)`,
      [companyId, leadId, content, direction, direction === 'outbound']
    );
  } finally { await pool.end(); }
}

// ── Buscar empresa ───────────────────────────
async function buscarEmpresa(instanceName) {
  const pool = await getPool();
  try {
    const result = await pool.query(
      `SELECT id, name FROM companies
       WHERE evolution_instance = $1 AND active = true LIMIT 1`,
      [instanceName]
    );
    if (result.rows.length > 0) return result.rows[0];

    // Fallback: primeira empresa ativa
    const fallback = await pool.query(
      `SELECT id, name FROM companies WHERE active = true ORDER BY created_at LIMIT 1`
    );
    return fallback.rows[0] || null;
  } finally { await pool.end(); }
}

// ── HANDLER PRINCIPAL ─────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, apikey');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET → health check
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      version: '2.3.0',
      configured: !!(
        process.env.EVOLUTION_URL &&
        process.env.EVOLUTION_API_KEY &&
        process.env.EVOLUTION_INSTANCE
      ),
      instance: process.env.EVOLUTION_INSTANCE || 'não configurado',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST (webhook) ou GET (status)' });
  }

  try {
    const payload = req.body;
    console.log('📨 Webhook recebido:', JSON.stringify(payload).substring(0, 400));

    const data     = payload.data;
    const instance = payload.instance;

    // Ignorar mensagens enviadas pela própria instância
    if (!data || data.key?.fromMe === true) {
      return res.status(200).json({ success: true, skipped: 'fromMe' });
    }

    // Ignorar reactions
    if (data.messageType === 'reactionMessage') {
      return res.status(200).json({ success: true, skipped: 'reaction' });
    }

    // Ignorar grupos
    const remoteJid = data.key?.remoteJid || '';
    if (remoteJid.includes('@g.us')) {
      return res.status(200).json({ success: true, skipped: 'grupo' });
    }

    // Extrair dados
    const phone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
    const nome  = data.pushName || data.key?.participant || 'Lead WhatsApp';
    const texto = data.message?.conversation
               || data.message?.extendedTextMessage?.text
               || data.message?.imageMessage?.caption
               || data.message?.buttonsResponseMessage?.selectedDisplayText
               || '';

    if (!phone || !texto) {
      console.log('⚠️ Sem phone ou texto, ignorando');
      return res.status(200).json({ success: true, skipped: 'sem phone ou texto' });
    }

    console.log(`📩 ${nome} (${phone}): ${texto.substring(0, 100)}`);

    // Identificar empresa
    const empresa = await buscarEmpresa(instance);
    if (!empresa) {
      console.error('❌ Empresa não encontrada para instância:', instance);
      return res.status(200).json({ success: false, error: 'Empresa não encontrada' });
    }

    console.log('🏢 Empresa:', empresa.name);

    // Processar
    const leadId = await salvarLead(empresa.id, nome, phone, texto);
    await salvarMensagem(empresa.id, leadId, texto, 'inbound');

    const mensagemIsis = await gerarMensagemIsis(nome, texto);
    const enviado = await enviarMensagem(phone, mensagemIsis);

    if (enviado) {
      await salvarMensagem(empresa.id, leadId, mensagemIsis, 'outbound');
    }

    return res.status(200).json({
      success: true,
      lead: leadId,
      empresa: empresa.name,
      enviado,
      preview: mensagemIsis.substring(0, 100)
    });

  } catch (err) {
    console.error('💥 Erro Evolution handler:', err);
    // Retorna 200 para Evolution não retentar
    return res.status(200).json({ success: false, error: err.message });
  }
}
