'use strict';

const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

module.exports = (sequelize, DataTypes) => {
  class Colaborador extends Model {
    static associate(models) {
      Colaborador.belongsTo(models.Departamento, {
        foreignKey: 'departamento_id',
        as: 'departamento',
      });
      Colaborador.belongsTo(models.Colaborador, {
        foreignKey: 'jefe_id',
        as: 'jefe',
      });
      Colaborador.hasMany(models.Colaborador, {
        foreignKey: 'jefe_id',
        as: 'subordinados',
      });
      Colaborador.hasMany(models.SaldoVacaciones, {
        foreignKey: 'colaborador_id',
        as: 'saldosVacaciones',
      });
      Colaborador.hasMany(models.Solicitud, {
        foreignKey: 'colaborador_id',
        as: 'solicitudes',
      });
      Colaborador.hasMany(models.Solicitud, {
        foreignKey: 'aprobador_id',
        as: 'solicitudesAprobadas',
      });
      Colaborador.hasMany(models.Incapacidad, {
        foreignKey: 'colaborador_id',
        as: 'incapacidades',
      });
      Colaborador.hasMany(models.Asistencia, {
        foreignKey: 'colaborador_id',
        as: 'asistencias',
      });
      Colaborador.hasMany(models.MovimientoPersonal, {
        foreignKey: 'colaborador_id',
        as: 'movimientos',
      });
      Colaborador.hasMany(models.ConsultaChat, {
        foreignKey: 'colaborador_id',
        as: 'consultasChat',
      });
      Colaborador.hasMany(models.ComprobanteMedico, {
        foreignKey: 'colaborador_id',
        as: 'comprobantesMedicos',
      });
      Colaborador.hasMany(models.ComprobanteMedico, {
        foreignKey: 'revisado_por',
        as: 'comprobantesRevisados',
      });
    }

    async verificarPassword(plano) {
      return bcrypt.compare(plano, this.password);
    }

    toJSON() {
      const datos = { ...this.get() };
      delete datos.password;
      datos.rol = datos.perfil_acceso || 'colaborador';
      return datos;
    }
  }

  Colaborador.init(
    {
      codigo_empleado: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      nombre: {
        type: DataTypes.STRING(120),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'El nombre es obligatorio' },
          len: { args: [2, 120], msg: 'El nombre debe tener entre 2 y 120 caracteres' },
        },
      },
      apellidos: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: { msg: 'Ese correo ya está registrado' },
        validate: {
          isEmail: { msg: 'El correo no tiene un formato válido' },
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      departamento_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      puesto: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      fecha_ingreso: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      salario_base: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      jefe_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      perfil_acceso: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'colaborador',
        validate: {
          isIn: [['colaborador', 'rrhh']],
        },
      },
      estado: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'activo',
        validate: {
          isIn: [['activo', 'inactivo', 'vacaciones', 'incapacidad']],
        },
      },
      cedula: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
      },
      telefono: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      fecha_nacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      provincia: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      canton: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      distrito: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      direccion_exacta: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      terminos_aceptados_en: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Colaborador',
      tableName: 'colaboradores',
      underscored: true,
      timestamps: true,
      defaultScope: {
        attributes: { exclude: ['password'] },
      },
      scopes: {
        conPassword: {
          attributes: {},
        },
      },
      hooks: {
        beforeSave: async (colaborador) => {
          if (colaborador.changed('password')) {
            colaborador.password = await bcrypt.hash(colaborador.password, SALT_ROUNDS);
          }
        },
      },
    }
  );

  return Colaborador;
};
