import { describe, it, expect, beforeAll } from 'vitest';
import React, { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useToast } from '../useToast';

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

function setupUseToast() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let latest: ReturnType<typeof useToast> | null = null;

  function TestHarness({ onUpdate }: { onUpdate: (val: ReturnType<typeof useToast>) => void }) {
    const value = useToast();
    useEffect(() => {
      onUpdate(value);
    });
    return null;
  }

  const root = createRoot(container);
  act(() => {
    root.render(
      React.createElement(TestHarness, {
        onUpdate: (val) => {
          latest = val;
        },
      })
    );
  });

  return {
    get current() {
      if (!latest) throw new Error('Hook not initialized');
      return latest;
    },
    cleanup: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('useToast', () => {
  it('starts with null toast, shows toast with default or custom type, and clears it', () => {
    const hook = setupUseToast();

    expect(hook.current.toast).toBeNull();

    act(() => {
      hook.current.showToast('Помилка маршруту');
    });
    expect(hook.current.toast).toEqual({ message: 'Помилка маршруту', type: 'error' });

    act(() => {
      hook.current.showToast('Збережено', 'info');
    });
    expect(hook.current.toast).toEqual({ message: 'Збережено', type: 'info' });

    act(() => {
      hook.current.clearToast();
    });
    expect(hook.current.toast).toBeNull();

    hook.cleanup();
  });
});
