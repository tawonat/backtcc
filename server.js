require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com MySQL local (use .env para configurar)
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'tcc',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.get('/', (req, res) => {
    res.status(200).send("Servidor do TCC online e acordado! 🚀");
});

app.post('/registro', async (req, res) => {
    const { rfid } = req.body;
    if (!rfid) return res.json({ permitido: false });

    try {
        const [rows] = await pool.query(
            'SELECT id, nome FROM professores WHERE rfid = ? AND ativo = 1',
            [rfid]
        );

        if (rows.length > 0) {
            const usuario = rows[0];
            await pool.query('INSERT INTO registros_acessos (professores_id) VALUES (?)', [usuario.id]);

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