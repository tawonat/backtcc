require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

// --- POOL DE CONEXÕES (Muito mais estável, não quebra o servidor) ---
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- Rota de Validação do RFID ---
app.post('/registro', async (req, res) => {
    const { rfid } = req.body;

    if (!rfid) {
        return res.json({ permitido: false, mensagem: "RFID não enviado" });
    }

    try {
        // Usa o pool para procurar o usuário
        const [users] = await pool.execute(
            'SELECT id, nome FROM usuarios WHERE rfid_tag = ? AND ativo = TRUE',
            [rfid]
        );

        if (users.length > 0) {
            const usuario = users[0];

            // Registra o acesso
            await pool.execute(
                'INSERT INTO registros_acesso (usuario_id) VALUES (?)',
                [usuario.id]
            );

            console.log(`[ACESSO LIBERADO] ${usuario.nome} passou pela cancela. (Tag: ${rfid})`);
            return res.json({ permitido: true, mensagem: `Bem-vindo, ${usuario.nome}` });
            
        } else {
            console.log(`[ACESSO NEGADO] Tentativa com cartão desconhecido/inativo: ${rfid}`);
            return res.json({ permitido: false, mensagem: "Cartão não autorizado" });
        }

    } catch (error) {
        // Se der erro no banco no meio do processo, ele avisa mas NÃO DESLIGA o servidor
        console.error("ERRO NO BANCO DE DADOS ao ler cartão:", error.message);
        return res.json({ permitido: false, mensagem: "Erro no servidor" });
    }
});

// --- Inicia o Servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    
    // Teste de Sobrevivência: Verifica o banco de dados logo ao ligar!
    try {
        const connection = await pool.getConnection();
        console.log(`Banco de dados conectado com sucesso!`);
        connection.release(); // Libera a conexão de volta pro pool
    } catch (err) {
        console.log(`\nALERTA VERMELHO: Não consegui conectar no MySQL!`);
        console.log(`Motivo do erro: ${err.message}`);
        console.log(`VERIFIQUE: As senhas no arquivo .env estão corretas?\n`);
    }

    console.log(`Esperando o ESP32 mandar os cartões...`);
});