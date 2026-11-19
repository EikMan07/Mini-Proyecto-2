'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('drive_sync_state', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      folder_id: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      page_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      ultima_sincronizacion: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      archivos_activos: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
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
    await queryInterface.dropTable('drive_sync_state');
  },
};
