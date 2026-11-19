'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const columnas = await queryInterface.describeTable('solicitudes');
      if (!columnas.motivo_rechazo) {
        await queryInterface.addColumn(
          'solicitudes',
          'motivo_rechazo',
          {
            type: Sequelize.TEXT,
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
      const columnas = await queryInterface.describeTable('solicitudes');
      if (columnas.motivo_rechazo) {
        await queryInterface.removeColumn('solicitudes', 'motivo_rechazo', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
