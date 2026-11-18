'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('saldos_vacaciones', 'fecha_ultima_acumulacion', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('saldos_vacaciones', 'fecha_ultima_acumulacion');
  },
};
