'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Asistencia extends Model {
    static associate(models) {
      Asistencia.belongsTo(models.Colaborador, {
        foreignKey: 'colaborador_id',
        as: 'colaborador',
      });
    }
  }

  Asistencia.init(
    {
      colaborador_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      hora_entrada: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      modalidad: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'presencial',
      },
      estado: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'presente',
      },
      comprobante_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      entidad_comprobante: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      observacion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Asistencia',
      tableName: 'asistencias',
      underscored: true,
      timestamps: true,
    }
  );

  return Asistencia;
};
