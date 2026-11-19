'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Solicitud extends Model {
    static associate(models) {
      Solicitud.belongsTo(models.Colaborador, {
        foreignKey: 'colaborador_id',
        as: 'colaborador',
      });
      Solicitud.belongsTo(models.Colaborador, {
        foreignKey: 'aprobador_id',
        as: 'aprobador',
      });
    }
  }

  Solicitud.init(
    {
      colaborador_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tipo: {
        type: DataTypes.STRING(40),
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
      dias_solicitados: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      motivo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estado: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      motivo_rechazo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      aprobador_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      creada_en: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Solicitud',
      tableName: 'solicitudes',
      underscored: true,
      timestamps: true,
    }
  );

  return Solicitud;
};
