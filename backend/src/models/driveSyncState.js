'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DriveSyncState extends Model {
    static associate() {
      // Estado persistente de sincronización incremental con Google Drive
    }
  }

  DriveSyncState.init(
    {
      folder_id: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },
      page_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ultima_sincronizacion: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      archivos_activos: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
    },
    {
      sequelize,
      modelName: 'DriveSyncState',
      tableName: 'drive_sync_state',
      underscored: true,
      timestamps: true,
    }
  );

  return DriveSyncState;
};
