'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Incapacidad extends Model {
    static associate(models) {
      Incapacidad.belongsTo(models.Colaborador, {
        foreignKey: 'colaborador_id',
        as: 'colaborador',
      });
    }
  }

  Incapacidad.init(
    {
      colaborador_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tipo: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      dias: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      entidad: {
        type: DataTypes.STRING(40),
        allowNull: false,
      },
      numero_boleta: {
        type: DataTypes.STRING(60),
        allowNull: true,
      },
      comprobante_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      estado: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'activa',
      },
    },
    {
      sequelize,
      modelName: 'Incapacidad',
      tableName: 'incapacidades',
      underscored: true,
      timestamps: true,
    }
  );

  return Incapacidad;
};
