'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Departamento extends Model {
    static associate(models) {
      Departamento.hasMany(models.Colaborador, {
        foreignKey: 'departamento_id',
        as: 'colaboradores',
      });
    }
  }

  Departamento.init(
    {
      codigo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: 'Departamento',
      tableName: 'departamentos',
      underscored: true,
      timestamps: true,
    }
  );

  return Departamento;
};
