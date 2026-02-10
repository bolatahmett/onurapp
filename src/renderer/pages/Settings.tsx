import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Download, Upload, FolderOpen } from 'lucide-react';
import { useIpc } from '../hooks/useIpc';
import { DataTable } from '../components/common/DataTable';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { formatDateTime, formatFileSize } from '../utils/formatters';
import { useAppStore } from '../store/appStore';
import type { BackupLog } from '@shared/types/entities';

interface BackupSettings {
  autoBackupEnabled: boolean;
  backupIntervalHours: number;
  maxBackups: number;
  backupDirectory: string;
}

export function Settings() {
  const { t, i18n } = useTranslation();
  const { setLanguage } = useAppStore();
  const { data: backupLogs, refresh: refreshLogs } = useIpc<BackupLog[]>(() => window.api.backup.getLogs());

  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    autoBackupEnabled: true,
    backupIntervalHours: 6,
    maxBackups: 10,
    backupDirectory: '',
  });
  const [showRestore, setShowRestore] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.api.backup.getSettings().then(setBackupSettings);
  }, []);

  const handleLanguageChange = async (lang: string) => {
    await i18n.changeLanguage(lang);
    setLanguage(lang);
    await window.api.settings.set('language', lang);
  };

  const handleBackupNow = async () => {
    setBackingUp(true);
    try {
      await window.api.backup.create();
      refreshLogs();
    } catch (err: any) {
      alert(err.message);
    }
    setBackingUp(false);
  };

  const handleRestore = async () => {
    const filePath = await window.api.backup.selectFile();
    if (!filePath) return;
    setShowRestore(true);
  };

  const confirmRestore = async () => {
    setShowRestore(false);
    try {
      const filePath = await window.api.backup.selectFile();
      if (filePath) {
        await window.api.backup.restore(filePath);
        alert(t('common.success'));
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSelectDirectory = async () => {
    const dir = await window.api.backup.selectDirectory();
    if (dir) {
      setBackupSettings({ ...backupSettings, backupDirectory: dir });
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await window.api.backup.updateSettings(backupSettings);
    } catch (err: any) {
      alert(err.message);
    }
    setSaving(false);
  };

  const logColumns = [
    {
      key: 'createdAt',
      header: t('common.date'),
      render: (item: BackupLog) => formatDateTime(item.createdAt),
    },
    { key: 'type', header: t('common.status') },
    {
      key: 'sizeBytes',
      header: 'Size',
      render: (item: BackupLog) => formatFileSize(item.sizeBytes),
    },
    {
      key: 'filePath',
      header: 'Path',
      render: (item: BackupLog) => (
        <span className="text-xs text-gray-500 truncate block max-w-xs" title={item.filePath}>
          {item.filePath}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="page-title">{t('settings.title')}</h2>

      {/* Language Selector Component */}
      <LanguageSelector currentLanguage={i18n.language} onLanguageChange={handleLanguageChange} />

      {/* Backup Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">{t('settings.backup')}</h3>

        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={handleBackupNow}
              disabled={backingUp}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} />
              {backingUp ? t('common.loading') : t('settings.backupNow')}
            </button>
            <button onClick={handleRestore} className="btn-secondary flex items-center gap-2">
              <Upload size={18} />
              {t('settings.restoreBackup')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoBackup"
                checked={backupSettings.autoBackupEnabled}
                onChange={(e) =>
                  setBackupSettings({ ...backupSettings, autoBackupEnabled: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label htmlFor="autoBackup" className="text-sm font-medium">
                {t('settings.autoBackup')}
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('settings.backupInterval')}
              </label>
              <input
                type="number"
                min="1"
                max="48"
                className="input-field"
                value={backupSettings.backupIntervalHours}
                onChange={(e) =>
                  setBackupSettings({
                    ...backupSettings,
                    backupIntervalHours: parseInt(e.target.value) || 6,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('settings.maxBackups')}</label>
              <input
                type="number"
                min="1"
                max="100"
                className="input-field"
                value={backupSettings.maxBackups}
                onChange={(e) =>
                  setBackupSettings({
                    ...backupSettings,
                    maxBackups: parseInt(e.target.value) || 10,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('settings.backupDirectory')}
              </label>
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  value={backupSettings.backupDirectory}
                  readOnly
                />
                <button onClick={handleSelectDirectory} className="btn-secondary btn-sm">
                  <FolderOpen size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleSaveSettings} disabled={saving} className="btn-primary flex items-center gap-2">
              <Save size={18} />
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">{t('settings.backupHistory')}</h3>
        <DataTable columns={logColumns} data={backupLogs ?? []} />
      </div>

      <ConfirmDialog
        open={showRestore}
        title={t('settings.restoreBackup')}
        message="This will replace your current database. Are you sure?"
        onConfirm={confirmRestore}
        onCancel={() => setShowRestore(false)}
        danger
      />
    </div>
  );
}
