
import { supabase } from './supabase';

export interface OfflineAction {
    id: string;
    table: string;
    data: any;
    timestamp: number;
}

const DB_NAME = 'matkeep_offline_db';
const STORE_NAME = 'pending_actions';

export const offlineService = {
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async saveAction(table: string, data: any) {
        const action: OfflineAction = {
            id: crypto.randomUUID(),
            table,
            data,
            timestamp: Date.now()
        };

        const db: any = await this.initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.add(action);

        // Tenta avisar o usuário que está offline via evento customizado
        window.dispatchEvent(new CustomEvent('offline_action_saved', { detail: action }));
        return action;
    },

    async getPendingActions(): Promise<OfflineAction[]> {
        const db: any = await this.initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async removeAction(id: string) {
        const db: any = await this.initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
    },

    async sync() {
        if (!navigator.onLine) return;

        const actions = await this.getPendingActions();
        if (actions.length === 0) return;

        console.log(`[Offline Sync] Sincronizando ${actions.length} ações pendentes...`);

        for (const action of actions) {
            try {
                const { error } = await supabase.from(action.table).insert([action.data]);
                if (!error) {
                    await this.removeAction(action.id);
                    console.log(`[Offline Sync] Ação ${action.id} sincronizada com sucesso.`);
                } else {
                    console.error(`[Offline Sync] Erro ao sincronizar ação ${action.id}:`, error);
                }
            } catch (err) {
                console.error(`[Offline Sync] Falha fatal na sincronização da ação ${action.id}:`, err);
            }
        }
    }
};

// Listener para quando a internet volta
window.addEventListener('online', () => {
    console.log('[Offline Sync] Internet detectada! Iniciando sincronização...');
    offlineService.sync();
});

// Sincronização periódica se estiver online
setInterval(() => {
    if (navigator.onLine) offlineService.sync();
}, 60000); // Tenta a cada 1 minuto
