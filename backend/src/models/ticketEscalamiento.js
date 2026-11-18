'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TicketEscalamiento extends Model {
    static associate(models) {
      TicketEscalamiento.belongsTo(models.Colaborador, {
        foreignKey: 'colaborador_id',
        as: 'colaborador',
      });
      TicketEscalamiento.belongsTo(models.Colaborador, {
        foreignKey: 'atendido_por_id',
        as: 'atendidoPor',
      });
      TicketEscalamiento.belongsTo(models.ConsultaChat, {
        foreignKey: 'consulta_chat_id',
        as: 'consultaChat',
      });
    }
  }

  TicketEscalamiento.init(
    {
      colaborador_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      consulta_chat_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      pregunta: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'abierto',
      },
      atendido_por_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      notas_rrhh: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'TicketEscalamiento',
      tableName: 'tickets_escalamiento',
      underscored: true,
      timestamps: true,
    }
  );

  return TicketEscalamiento;
};
