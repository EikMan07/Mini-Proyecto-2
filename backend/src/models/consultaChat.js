'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ConsultaChat extends Model {
    static associate(models) {
      ConsultaChat.belongsTo(models.Colaborador, {
        foreignKey: 'colaborador_id',
        as: 'colaborador',
      });
    }
  }

  ConsultaChat.init(
    {
      colaborador_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      pregunta: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      respuesta: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      tema: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: 'general',
      },
      intencion: {
        type: DataTypes.STRING(40),
        allowNull: false,
      },
      agente: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      documentos_citados: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      similitud_maxima: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: true,
      },
      resuelta: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      escalada: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      latencia_ms: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      fecha: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'ConsultaChat',
      tableName: 'consultas_chat',
      underscored: true,
      timestamps: true,
    }
  );

  return ConsultaChat;
};
