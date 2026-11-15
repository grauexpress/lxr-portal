
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));
const PORT = process.env.PORT || 3000;

if (!process.env.MONGODB_URI ||
    !process.env.ADMIN_PASSWORD ||
    !process.env.SESSION_SECRET) {
  console.error("ERRO: confira as variáveis do arquivo .env.");
  process.exit(1);
}

app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
  ],
  credentials: true
}));

app.use(express.json({ limit: "10kb" }));

// Modelo dos cadastros
const registrationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  surname: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  consent: {
    type: Boolean,
    required: true
  }
}, {
  timestamps: true,
  collection: "registros"
});

const Registration = mongoose.model(
  "Registration",
  registrationSchema
);

// Sessões administrativas
app.use(session({
  name: "lxr_admin_session",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: "sessoes_admin",
    ttl: 60 * 60 * 4
  }),
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 4 * 60 * 60 * 1000
  }
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false
});

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});

function requireAdmin(req, res, next) {
  if (!req.session || req.session.isAdmin !== true) {
    return res.status(401).json({
      authenticated: false,
      error: "Acesso administrativo não autorizado."
    });
  }

  next();
}

// Status do servidor
app.get("/api/status", (req, res) => {
  res.json({
    online: true,
    message: "Servidor LXR PORTAL funcionando."
  });
});

// Receber cadastro autorizado
app.post("/api/registrations", registrationLimiter, async (req, res) => {
  try {
    const { email, surname, phone, consent } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof surname !== "string" ||
      typeof phone !== "string" ||
      consent !== true
    ) {
      return res.status(400).json({
        error: "Preencha os campos e autorize o armazenamento."
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanSurname = surname.trim();
    const cleanPhone = phone.replace(/\D/g, "");

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

    if (!validEmail || cleanEmail.length > 254) {
      return res.status(400).json({
        error: "Informe um e-mail válido."
      });
    }

    if (cleanSurname.length < 1 || cleanSurname.length > 100) {
      return res.status(400).json({
        error: "Confira o sobrenome informado."
      });
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      return res.status(400).json({
        error: "Informe um telefone válido com DDD."
      });
    }

    const registration = await Registration.create({
      email: cleanEmail,
      surname: cleanSurname,
      phone: cleanPhone,
      consent: true
    });

    res.status(201).json({
      success: true,
      message: "Cadastro realizado com sucesso.",
      id: registration._id
    });

  } catch (error) {
    console.error("Erro ao salvar cadastro:", error.message);

    res.status(500).json({
      error: "Não foi possível salvar o cadastro."
    });
  }
});

// Login administrativo
app.post("/api/admin/login", loginLimiter, (req, res, next) => {
  const password = req.body?.password;

  if (typeof password !== "string") {
    return res.status(400).json({
      error: "Informe a senha."
    });
  }

  const received = Buffer.from(password);
  const expected = Buffer.from(process.env.ADMIN_PASSWORD);

  const valid =
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected);

  if (!valid) {
    return res.status(401).json({
      error: "Senha incorreta."
    });
  }

  req.session.regenerate((error) => {
    if (error) return next(error);

    req.session.isAdmin = true;

    req.session.save((saveError) => {
      if (saveError) return next(saveError);

      res.json({
        authenticated: true,
        message: "Acesso administrativo autorizado."
      });
    });
  });
});

// Verificar sessão administrativa
app.get("/api/admin/me", requireAdmin, (req, res) => {
  res.json({ authenticated: true });
});

// Listar registros: somente ADMIN autenticado
app.get("/api/admin/registrations", requireAdmin, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim().slice(0, 100);

    let filter = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(escaped, "i");

      filter = {
        $or: [
          { surname: pattern },
          { email: pattern },
          { phone: pattern }
        ]
      };
    }

    const [records, total] = await Promise.all([
      Registration.find(filter)
        .select("email surname phone createdAt")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),

      Registration.countDocuments(filter)
    ]);

    res.json({
      total,
      records
    });

  } catch (error) {
    console.error("Erro ao consultar registros:", error.message);

    res.status(500).json({
      error: "Não foi possível consultar os registros."
    });
  }
});

// Encerrar sessão
app.post("/api/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        error: "Não foi possível encerrar a sessão."
      });
    }

    res.clearCookie("lxr_admin_session", {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    });

    res.json({ message: "Sessão encerrada." });
  });
});

// Erros gerais
app.use((error, req, res, next) => {
  console.error("Erro interno:", error.message);

  res.status(500).json({
    error: "Ocorreu um erro interno."
  });
});

// Inicialização
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB conectado com sucesso!");

    app.listen(PORT, () => {
      console.log(`Servidor ativo em http://127.0.0.1:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erro ao conectar ao MongoDB:", error.message);
    process.exit(1);
  });
