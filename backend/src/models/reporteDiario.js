'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReporteDiario extends Model {
    static associate() {
      // Tabla de reportes diarios consolidados
    }
  }

  ReporteDiario.init(
    {
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true,
      },
      datos_json: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      resumen_texto: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      generado_por: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: 'Agente Analista Diario',
      },
    },
    {
      sequelize,
      modelName: 'ReporteDiario',
      tableName: 'reportes_diarios',
      underscored: true,
      timestamps: true,
    }
  );

  return ReporteDiario;
};
