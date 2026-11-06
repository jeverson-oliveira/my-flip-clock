import { applyHostClass, isExtensionHost, isTauriHost, usesHashRouting, hideTauriWindow } from './platform';

describe('platform', () => {
  afterEach(() => {
    document.documentElement.classList.remove('host-extension', 'host-tauri');
    delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    delete (window as unknown as { __TAURI__?: unknown }).__TAURI__;
  });

  it('should not be an extension or Tauri by default', () => {
    expect(isExtensionHost()).toBeFalse();
    expect(isTauriHost()).toBeFalse();
    expect(usesHashRouting()).toBeFalse();
  });

  it('should detect Tauri via __TAURI_INTERNALS__', () => {
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    expect(isTauriHost()).toBeTrue();
    expect(usesHashRouting()).toBeTrue();
  });

  it('should not be an extension on http(s)', () => {
    expect(isExtensionHost()).toBeFalse();
  });

  it('should add host classes', () => {
    applyHostClass();
    expect(document.documentElement.classList.contains('host-extension')).toBeFalse();

    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    applyHostClass();
    expect(document.documentElement.classList.contains('host-tauri')).toBeTrue();
  });

  it('should do nothing when hiding outside Tauri', async () => {
    await expectAsync(hideTauriWindow()).toBeResolved();
  });

  it('should hide the Tauri window', async () => {
    const hide = jasmine.createSpy('hide').and.returnValue(Promise.resolve());
    (window as unknown as { __TAURI__?: unknown }).__TAURI__ = {
      window: { getCurrentWindow: () => ({ hide }) }
    };
    await hideTauriWindow();
    expect(hide).toHaveBeenCalled();
  });

  it('should ignore Tauri hide errors', async () => {
    const hide = jasmine.createSpy('hide').and.returnValue(Promise.reject(new Error('boom')));
    (window as unknown as { __TAURI__?: unknown }).__TAURI__ = {
      window: { getCurrentWindow: () => ({ hide }) }
    };
    await expectAsync(hideTauriWindow()).toBeResolved();
  });

  it('should tolerate a Tauri global without window helpers', async () => {
    (window as unknown as { __TAURI__?: unknown }).__TAURI__ = {};
    await expectAsync(hideTauriWindow()).toBeResolved();
  });
});
