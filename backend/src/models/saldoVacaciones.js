'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SaldoVacaciones extends Model {
    static associate(models) {
      SaldoVacaciones.belongsTo(models.Colaborador, {
        foreignKey: 'colaborador_id',
        as: 'colaborador',
      });
    }
  }

  SaldoVacaciones.init(
    {
      colaborador_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      periodo: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      dias_asignados: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      dias_tomados: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      dias_disponibles: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'SaldoVacaciones',
      tableName: 'saldos_vacaciones',
      underscored: true,
      timestamps: true,
    }
  );

  return SaldoVacaciones;
};
