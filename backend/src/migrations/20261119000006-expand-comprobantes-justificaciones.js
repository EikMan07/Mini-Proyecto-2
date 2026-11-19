'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const columnas = await queryInterface.describeTable('comprobantes_medicos');

      const adiciones = [
        [
          'tipo_justificacion',
          {
            type: Sequelize.STRING(60),
            allowNull: false,
            defaultValue: 'incapacidad_ccss',
          },
        ],
        ['fecha_inicio_ausencia', { type: Sequelize.DATEONLY, allowNull: true }],
        ['fecha_fin_ausencia', { type: Sequelize.DATEONLY, allowNull: true }],
        ['observacion', { type: Sequelize.TEXT, allowNull: true }],
      ];

      for (const [col, def] of adiciones) {
        if (!columnas[col]) {
          await queryInterface.addColumn('comprobantes_medicos', col, def, { transaction });
        }
      }

      const indices = await queryInterface.showIndex('comprobantes_medicos', { transaction });
      if (!indices.some((idx) => idx.name === 'idx_comprobantes_medicos_tipo_justificacion')) {
        await queryInterface.addIndex('comprobantes_medicos', ['tipo_justificacion'], {
          name: 'idx_comprobantes_medicos_tipo_justificacion',
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
      const indices = await queryInterface.showIndex('comprobantes_medicos', { transaction });
      if (indices.some((idx) => idx.name === 'idx_comprobantes_medicos_tipo_justificacion')) {
        await queryInterface.removeIndex(
          'comprobantes_medicos',
          'idx_comprobantes_medicos_tipo_justificacion',
          { transaction }
        );
      }

      const columnas = await queryInterface.describeTable('comprobantes_medicos');
      for (const col of [
        'observacion',
        'fecha_fin_ausencia',
        'fecha_inicio_ausencia',
        'tipo_justificacion',
      ]) {
        if (columnas[col]) {
          await queryInterface.removeColumn('comprobantes_medicos', col, { transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
