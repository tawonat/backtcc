require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Configuração para o Postgres do Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Necessário para o Render
});

app.get('/', (req, res) => {
    res.status(200).send("Servidor do TCC online e acordado! 🚀");
  });

app.post('/registro', async (req, res) => {
    const { rfid } = req.body;
    if (!rfid) return res.json({ permitido: false });

    try {
        // No Postgres usamos $1
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
        console.error(err);
        res.status(500).send("Erro no banco");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));