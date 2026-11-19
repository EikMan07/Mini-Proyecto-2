'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const cols = await queryInterface.describeTable('saldos_vacaciones');
      if (!cols.fecha_ultima_acumulacion) {
        await queryInterface.addColumn(
          'saldos_vacaciones',
          'fecha_ultima_acumulacion',
          {
            type: Sequelize.DATE,
            allowNull: true,
          },
          { transaction }
        );
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
      const cols = await queryInterface.describeTable('saldos_vacaciones');
      if (cols.fecha_ultima_acumulacion) {
        await queryInterface.removeColumn('saldos_vacaciones', 'fecha_ultima_acumulacion', {
          transaction,
        });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
