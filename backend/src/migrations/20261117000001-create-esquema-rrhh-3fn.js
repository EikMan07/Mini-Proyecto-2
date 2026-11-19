'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // MySQL almacena los embeddings como JSON; la similitud coseno se calcula en Node.js.

    // 1. departamentos
    await queryInterface.createTable('departamentos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      codigo: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 2. colaboradores
    await queryInterface.createTable('colaboradores', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      codigo_empleado: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      nombre: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      departamento_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'departamentos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      puesto: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      fecha_ingreso: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      salario_base: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      jefe_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'colaboradores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      perfil_acceso: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'colaborador',
      },
      estado: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'activo',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('colaboradores', ['departamento_id'], {
      name: 'idx_colaboradores_departamento_id',
    });
    await queryInterface.addIndex('colaboradores', ['jefe_id'], {
      name: 'idx_colaboradores_jefe_id',
    });

    // 3. saldos_vacaciones
    await queryInterface.createTable('saldos_vacaciones', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      colaborador_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'colaboradores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      periodo: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      dias_asignados: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      dias_tomados: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      dias_disponibles: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('saldos_vacaciones', ['colaborador_id'], {
      name: 'idx_saldos_vacaciones_colaborador_id',
    });
    await queryInterface.addIndex('saldos_vacaciones', ['colaborador_id', 'periodo'], {
      unique: true,
      name: 'uq_saldos_vacaciones_colaborador_periodo',
    });

    // 4. solicitudes
    await queryInterface.createTable('solicitudes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      colaborador_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'colaboradores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      tipo: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      fecha_inicio: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      fecha_fin: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      dias_solicitados: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      motivo: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      estado: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      aprobador_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'colaboradores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      creada_en: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('solicitudes', ['colaborador_id'], {
      name: 'idx_solicitudes_colaborador_id',
    });
    await queryInterface.addIndex('solicitudes', ['aprobador_id'], {
      name: 'idx_solicitudes_aprobador_id',
    });
    await queryInterface.addIndex('solicitudes', ['estado'], {
      name: 'idx_solicitudes_estado',
    });

    // 5. incapacidades
    await queryInterface.createTable('incapacidades', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      colaborador_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'colaboradores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      tipo: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      fecha_inicio: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      fecha_fin: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      dias: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      entidad: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      numero_boleta: {
        type: Sequelize.STRING(60),
        allowNull: true,
      },
      comprobante_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      estado: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'activa',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('incapacidades', ['colaborador_id'], {
      name: 'idx_incapacidades_colaborador_id',
    });

    // 6. asistencias
    await queryInterface.createTable('asistencias', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      colaborador_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'colaboradores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      hora_entrada: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      modalidad: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'presencial',
      },
      estado: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'presente',
      },
      comprobante_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      entidad_comprobante: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      observacion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('asistencias', ['colaborador_id'], {
      name: 'idx_asistencias_colaborador_id',
    });
    await queryInterface.addIndex('asistencias', ['fecha'], {
      name: 'idx_asistencias_fecha',
    });

    // 7. movimientos_personal
    await queryInterface.createTable('movimientos_personal', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      colaborador_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'colaboradores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      tipo: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      motivo: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      puesto_anterior: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      puesto_nuevo: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('movimientos_personal', ['colaborador_id'], {
      name: 'idx_movimientos_personal_colaborador_id',
    });

    // 8. fragmentos_documento
    await queryInterface.createTable('fragmentos_documento', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      drive_file_id: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      documento_titulo: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      formato: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      version: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'v1.0',
      },
      fecha_vigencia: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      responsable: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      seccion: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      enlace_drive: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      indice_fragmento: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      contenido: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      tokens_estimados: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      embedding_json: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      hash_archivo: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('fragmentos_documento', ['drive_file_id'], {
      name: 'idx_fragmentos_documento_drive_file_id',
    });

    // 9. consultas_chat
    await queryInterface.createTable('consultas_chat', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      colaborador_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'colaboradores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      pregunta: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      respuesta: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      tema: {
        type: Sequelize.STRING(80),
        allowNull: false,
        defaultValue: 'general',
      },
      intencion: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      agente: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      documentos_citados: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      similitud_maxima: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: true,
      },
      resuelta: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      escalada: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      latencia_ms: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      fecha: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('consultas_chat', ['colaborador_id'], {
      name: 'idx_consultas_chat_colaborador_id',
    });
    await queryInterface.addIndex('consultas_chat', ['fecha'], {
      name: 'idx_consultas_chat_fecha',
    });

    // 10. reportes_diarios
    await queryInterface.createTable('reportes_diarios', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        unique: true,
      },
      datos_json: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      resumen_texto: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      generado_por: {
        type: Sequelize.STRING(80),
        allowNull: false,
        defaultValue: 'Agente Analista Diario',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reportes_diarios');
    await queryInterface.dropTable('consultas_chat');
    await queryInterface.dropTable('fragmentos_documento');
    await queryInterface.dropTable('movimientos_personal');
    await queryInterface.dropTable('asistencias');
    await queryInterface.dropTable('incapacidades');
    await queryInterface.dropTable('solicitudes');
    await queryInterface.dropTable('saldos_vacaciones');
    await queryInterface.dropTable('colaboradores');
    await queryInterface.dropTable('departamentos');
  },
};
