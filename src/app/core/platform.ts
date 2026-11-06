/**
 * Detecção do "host" onde o app está rodando.
 *
 * O mesmo bundle Angular é usado em três alvos:
 *  - site (GitHub Pages)  → history API, service worker/PWA ativo
 *  - extensão do Chrome    → protocolo chrome-extension:, hash routing, sem SW
 *  - widget desktop/Tauri  → protocolo tauri, hash routing, sem SW, transparente
 */

export function isExtensionHost(): boolean {
  return typeof location !== 'undefined' && location.protocol === 'chrome-extension:';
}

export function isTauriHost(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Extensão e Tauri não servem arquivos por HTTP, então usamos hash routing. */
export function usesHashRouting(): boolean {
  return isExtensionHost() || isTauriHost();
}

/** Marca o <html> para estilos específicos de cada host (tamanho do popup, transparência). */
export function applyHostClass(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (isExtensionHost()) root.classList.add('host-extension');
  if (isTauriHost()) root.classList.add('host-tauri');
}

export interface TauriWindowHandle {
  hide: () => Promise<void>;
}

interface TauriGlobal {
  window?: { getCurrentWindow?: () => TauriWindowHandle };
}

/** Esconde a janela do widget (noop fora do Tauri). */
export async function hideTauriWindow(): Promise<void> {
  const tauri = (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__;
  const appWindow = tauri?.window?.getCurrentWindow?.();
  if (!appWindow) return;
  try {
    await appWindow.hide();
  } catch {
    /* ignore */
  }
}
