require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🛠️ CORREÇÃO DO BANCO: Configuração robusta de SSL para o Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        // Força o Node.js a manter a conexão viva e segura
        keepAlive: true 
    },
    // Tempo máximo que uma conexão pode ficar ociosa antes de fechar
    idleTimeoutMillis: 30000, 
    // Tempo máximo para conseguir abrir uma conexão
    connectionTimeoutMillis: 2000, 
});

// O resto do seu código (app.get, app.post, app.listen) continua IGUALZINHO...
app.get('/', (req, res) => {
    res.status(200).send("Servidor do TCC online e acordado! 🚀");
});

app.post('/registro', async (req, res) => {
    const { rfid } = req.body;
    if (!rfid) return res.json({ permitido: false });

    try {
        const result = await pool.query(
            'SELECT id, nome FROM usuarios WHERE rfid_tag = $1 AND ativo = TRUE',
            [rfid]
        );

        if (result.rows.length > 0) {
            const usuario = result.rows[0];
            await pool.query('INSERT INTO registros_acesso (usuario_id) VALUES ($1)', [usuario.id]);
            
            console.log(`✅ Liberado: ${usuario.nome}`);
            return res.json({ permitido: true, mensaje: `Olá, ${usuario.nome}` });
        } else {
            console.log(`❌ Negado: ${rfid}`);
            return res.json({ permitido: false });
        }
    } catch (err) {
        console.error("Erro interno no banco:", err.message); // Melhorado para ler o erro limpo
        res.status(500).send("Erro no banco");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando localmente na porta ${PORT}`));