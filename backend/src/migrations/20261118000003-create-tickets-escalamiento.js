'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tickets_escalamiento', {
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
      consulta_chat_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'consultas_chat',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      pregunta: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      estado: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'abierto',
      },
      atendido_por_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'colaboradores',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notas_rrhh: {
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

    await queryInterface.addIndex('tickets_escalamiento', ['colaborador_id'], {
      name: 'idx_tickets_escalamiento_colaborador_id',
    });
    await queryInterface.addIndex('tickets_escalamiento', ['consulta_chat_id'], {
      name: 'idx_tickets_escalamiento_consulta_chat_id',
    });
    await queryInterface.addIndex('tickets_escalamiento', ['atendido_por_id'], {
      name: 'idx_tickets_escalamiento_atendido_por_id',
    });
    await queryInterface.addIndex('tickets_escalamiento', ['estado'], {
      name: 'idx_tickets_escalamiento_estado',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tickets_escalamiento');
  },
};
