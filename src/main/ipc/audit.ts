import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { auditService } from '../services/AuditService';

export function registerAuditIpc(): void {
    ipcMain.handle(IpcChannels.AUDIT_GET_LOGS, async (_, params?: {
        entityType?: string;
        entityId?: string;
        limit?: number;
        offset?: number;
    }) => {
        return auditService.getLogs(
            params?.entityType,
            params?.entityId,
            params?.limit ?? 100,
            params?.offset ?? 0,
        );
    });
}
