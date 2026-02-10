
import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/types/ipc';
import { AuthService } from '../services/AuthService';
import { CreateUserDto, UpdateUserDto, LoginDto } from '../../shared/types/entities';

export function registerAuthIpc(): void {
    const authService = AuthService.getInstance();

    ipcMain.handle(IpcChannels.AUTH_LOGIN, async (_, dto: LoginDto) => {
        return authService.login(dto);
    });

    ipcMain.handle(IpcChannels.AUTH_GET_CURRENT_USER, async () => {
        // This function can be used to restore session. 
        // In a real app we'd check a session token. 
        // For now we rely on the renderer to store user state, 
        // or we could implement session persistence.
        // Returning null for now as we don't have persistent sessions on backend yet.
        return null;
    });

    ipcMain.handle(IpcChannels.AUTH_CREATE_USER, async (_, dto: CreateUserDto) => {
        return authService.createUser(dto);
    });

    ipcMain.handle(IpcChannels.AUTH_UPDATE_USER, async (_, { id, dto }: { id: string; dto: UpdateUserDto }) => {
        return authService.updateUser(id, dto);
    });

    ipcMain.handle(IpcChannels.AUTH_DELETE_USER, async (_, id: string) => {
        return authService.deleteUser(id);
    });

    ipcMain.handle(IpcChannels.AUTH_GET_ALL_USERS, async () => {
        return authService.getAllUsers();
    });
}
