'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'rrhh_rag_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

const db = {};

fs.readdirSync(__dirname)
  .filter((f) => f !== 'index.js' && f.endsWith('.js') && !f.includes('.template'))
  .forEach((f) => {
    const model = require(path.join(__dirname, f))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.values(db).forEach((m) => {
  if (typeof m.associate === 'function') {
    m.associate(db);
  }
});

// Alias de conveniencia para compatibilidad con controladores/utilidades
if (db.Colaborador && !db.Usuario) {
  db.Usuario = db.Colaborador;
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
