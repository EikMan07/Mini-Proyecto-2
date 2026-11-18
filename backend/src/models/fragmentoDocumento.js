'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FragmentoDocumento extends Model {
    static associate() {
      // Tabla independiente de almacén vectorial de documentos de políticas
    }
  }

  FragmentoDocumento.init(
    {
      drive_file_id: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      documento_titulo: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      formato: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      version: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'v1.0',
      },
      fecha_vigencia: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      responsable: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      seccion: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      enlace_drive: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      indice_fragmento: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      contenido: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      tokens_estimados: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      embedding_json: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      hash_archivo: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'FragmentoDocumento',
      tableName: 'fragmentos_documento',
      underscored: true,
      timestamps: true,
    }
  );

  return FragmentoDocumento;
};
