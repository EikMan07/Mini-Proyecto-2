'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ComprobanteMedico extends Model {
    static associate(models) {
      ComprobanteMedico.belongsTo(models.Colaborador, {
        foreignKey: 'colaborador_id',
        as: 'colaborador',
      });
      ComprobanteMedico.belongsTo(models.Colaborador, {
        foreignKey: 'revisado_por',
        as: 'revisor',
      });
    }
  }

  ComprobanteMedico.init(
    {
      colaborador_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nombre_archivo: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      tipo_mime: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      tamano_bytes: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ruta_archivo: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
          isIn: [['pendiente', 'aprobado', 'rechazado']],
        },
      },
      tipo_justificacion: {
        type: DataTypes.STRING(60),
        allowNull: false,
        defaultValue: 'incapacidad_ccss',
        validate: {
          isIn: [
            [
              'incapacidad_ccss',
              'incapacidad_ins',
              'cita_medica',
              'duelo_familiar',
              'citacion_judicial',
              'licencia_maternidad_paternidad',
              'fuerza_mayor',
            ],
          ],
        },
      },
      fecha_inicio_ausencia: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      fecha_fin_ausencia: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      observacion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      observacion_rrhh: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      revisado_por: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'ComprobanteMedico',
      tableName: 'comprobantes_medicos',
      underscored: true,
      timestamps: true,
    }
  );

  return ComprobanteMedico;
};
