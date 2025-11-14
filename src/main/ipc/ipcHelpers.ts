import { ipcMain, IpcMainInvokeEvent } from 'electron';

/**
 * Safely register an IPC handler. If a handler already exists for the channel,
 * it will be removed before registering the new one.
 * This prevents "Attempted to register a second handler" errors in development
 * when hot module replacement reloads the code.
 */
export function safeHandle(
  channel: string,
  listener: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any> | any
): void {
  // Remove existing handler if it exists
  ipcMain.removeHandler(channel);
  // Register the new handler
  ipcMain.handle(channel, listener);
}
