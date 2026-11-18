'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MovimientoPersonal extends Model {
    static associate(models) {
      MovimientoPersonal.belongsTo(models.Colaborador, {
        foreignKey: 'colaborador_id',
        as: 'colaborador',
      });
    }
  }

  MovimientoPersonal.init(
    {
      colaborador_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tipo: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      motivo: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      puesto_anterior: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      puesto_nuevo: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'MovimientoPersonal',
      tableName: 'movimientos_personal',
      underscored: true,
      timestamps: true,
    }
  );

  return MovimientoPersonal;
};
