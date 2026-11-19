'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const colsColaboradores = await queryInterface.describeTable('colaboradores');

      const columnasNuevasColaboradores = [
        ['cedula', { type: Sequelize.STRING(20), allowNull: true }],
        ['telefono', { type: Sequelize.STRING(30), allowNull: true }],
        ['fecha_nacimiento', { type: Sequelize.DATEONLY, allowNull: true }],
        ['provincia', { type: Sequelize.STRING(80), allowNull: true }],
        ['canton', { type: Sequelize.STRING(80), allowNull: true }],
        ['distrito', { type: Sequelize.STRING(80), allowNull: true }],
        ['direccion_exacta', { type: Sequelize.TEXT, allowNull: true }],
        ['terminos_aceptados_en', { type: Sequelize.DATE, allowNull: true }],
      ];

      for (const [col, def] of columnasNuevasColaboradores) {
        if (!colsColaboradores[col]) {
          await queryInterface.addColumn('colaboradores', col, def, { transaction });
        }
      }

      const indicesColab = await queryInterface.showIndex('colaboradores', { transaction });
      const tieneIdxCedula = indicesColab.some((i) => i.name === 'idx_colaboradores_cedula_unique');
      if (!tieneIdxCedula) {
        await queryInterface.addIndex('colaboradores', ['cedula'], {
          unique: true,
          name: 'idx_colaboradores_cedula_unique',
          transaction,
        });
      }

      const colsAsistencias = await queryInterface.describeTable('asistencias');
      if (!colsAsistencias.hora_salida) {
        await queryInterface.addColumn(
          'asistencias',
          'hora_salida',
          { type: Sequelize.STRING(20), allowNull: true },
          { transaction }
        );
      }

      const tablasRaw = await queryInterface.showAllTables({ transaction });
      const tablas = tablasRaw.map((t) => (typeof t === 'string' ? t : t.tableName));

      if (!tablas.includes('comprobantes_medicos')) {
        await queryInterface.createTable(
          'comprobantes_medicos',
          {
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
            nombre_archivo: {
              type: Sequelize.STRING(255),
              allowNull: false,
            },
            tipo_mime: {
              type: Sequelize.STRING(100),
              allowNull: false,
            },
            tamano_bytes: {
              type: Sequelize.INTEGER,
              allowNull: false,
            },
            ruta_archivo: {
              type: Sequelize.STRING(255),
              allowNull: false,
            },
            estado: {
              type: Sequelize.STRING(30),
              allowNull: false,
              defaultValue: 'pendiente',
            },
            observacion_rrhh: {
              type: Sequelize.TEXT,
              allowNull: true,
            },
            revisado_por: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: {
                model: 'colaboradores',
                key: 'id',
              },
              onUpdate: 'CASCADE',
              onDelete: 'SET NULL',
            },
            created_at: {
              type: Sequelize.DATE,
              allowNull: false,
            },
            updated_at: {
              type: Sequelize.DATE,
              allowNull: false,
            },
          },
          { transaction }
        );

        await queryInterface.addIndex('comprobantes_medicos', ['colaborador_id'], {
          name: 'idx_comprobantes_medicos_colaborador_id',
          transaction,
        });
        await queryInterface.addIndex('comprobantes_medicos', ['revisado_por'], {
          name: 'idx_comprobantes_medicos_revisado_por',
          transaction,
        });
        await queryInterface.addIndex('comprobantes_medicos', ['estado'], {
          name: 'idx_comprobantes_medicos_estado',
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tablasRaw = await queryInterface.showAllTables({ transaction });
      const tablas = tablasRaw.map((t) => (typeof t === 'string' ? t : t.tableName));

      if (tablas.includes('comprobantes_medicos')) {
        await queryInterface.dropTable('comprobantes_medicos', { transaction });
      }

      const colsAsistencias = await queryInterface.describeTable('asistencias');
      if (colsAsistencias.hora_salida) {
        await queryInterface.removeColumn('asistencias', 'hora_salida', { transaction });
      }

      const indicesColab = await queryInterface.showIndex('colaboradores', { transaction });
      if (indicesColab.some((i) => i.name === 'idx_colaboradores_cedula_unique')) {
        await queryInterface.removeIndex('colaboradores', 'idx_colaboradores_cedula_unique', {
          transaction,
        });
      }

      const colsColaboradores = await queryInterface.describeTable('colaboradores');
      const columnasAEliminar = [
        'terminos_aceptados_en',
        'direccion_exacta',
        'distrito',
        'canton',
        'provincia',
        'fecha_nacimiento',
        'telefono',
        'cedula',
      ];
      for (const col of columnasAEliminar) {
        if (colsColaboradores[col]) {
          await queryInterface.removeColumn('colaboradores', col, { transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
