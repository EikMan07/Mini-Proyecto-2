'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const cols = await queryInterface.describeTable('colaboradores');
      if (!cols.apellidos) {
        await queryInterface.addColumn(
          'colaboradores',
          'apellidos',
          { type: Sequelize.STRING(120), allowNull: true },
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
      const cols = await queryInterface.describeTable('colaboradores');
      if (cols.apellidos) {
        await queryInterface.removeColumn('colaboradores', 'apellidos', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
