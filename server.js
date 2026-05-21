require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🛠️ ATUALIZADO: Inicialização limpa do Pool. 
// O SSL agora é gerenciado diretamente pela string de conexão do .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

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
            return res.json({ permitido: true, mensagem: `Olá, ${usuario.nome}` });
        } else {
            console.log(`❌ Negado: ${rfid}`);
            return res.json({ permitido: false });
        }
    } catch (err) {
        console.error("Erro interno no banco:", err.message);
        res.status(500).send("Erro no banco");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando localmente na porta ${PORT}`));