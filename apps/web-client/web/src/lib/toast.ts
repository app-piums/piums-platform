type ToastType = 'success' | 'error' | 'info' | 'warning';

const STYLES: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: '✓' },
  error:   { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', icon: '✕' },
  info:    { bg: '#eff6ff', border: '#93c5fd', color: '#1e40af', icon: 'ℹ' },
  warning: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', icon: '⚠' },
};

let container: HTMLDivElement | null = null;

function getContainer(): HTMLDivElement {
  if (!container || !document.body.contains(container)) {
    container = document.createElement('div');
    container.style.cssText =
      'position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;' +
      'max-width:360px;width:calc(100% - 2rem);pointer-events:none;';
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message: string, type: ToastType = 'info'): void {
  if (typeof document === 'undefined') return;
  const cont = getContainer();
  const { bg, border, color, icon } = STYLES[type];

  const el = document.createElement('div');
  el.style.cssText =
    `background:${bg};border:1px solid ${border};color:${color};` +
    'padding:0.875rem 1rem;border-radius:0.75rem;display:flex;align-items:flex-start;gap:0.625rem;' +
    'box-shadow:0 4px 16px rgba(0,0,0,.12);pointer-events:all;' +
    'opacity:0;transform:translateX(0.75rem);transition:opacity 0.2s ease,transform 0.2s ease;' +
    'font-size:0.875rem;line-height:1.45;font-family:inherit;';

  const iconEl = document.createElement('span');
  iconEl.textContent = icon;
  iconEl.style.cssText = 'font-weight:700;flex-shrink:0;margin-top:0.05rem;';

  const msgEl = document.createElement('span');
  msgEl.textContent = message;
  msgEl.style.cssText = 'flex:1;word-break:break-word;';

  const closeEl = document.createElement('button');
  closeEl.innerHTML = '&times;';
  closeEl.style.cssText =
    'background:none;border:none;cursor:pointer;color:inherit;opacity:0.55;' +
    'font-size:1.1rem;line-height:1;padding:0;flex-shrink:0;margin-top:-0.05rem;';

  el.appendChild(iconEl);
  el.appendChild(msgEl);
  el.appendChild(closeEl);
  cont.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateX(0)';
  });

  const remove = () => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(0.75rem)';
    setTimeout(() => {
      el.remove();
      if (cont.children.length === 0) {
        cont.remove();
        container = null;
      }
    }, 220);
  };

  const timer = setTimeout(remove, 4000);
  closeEl.addEventListener('click', () => { clearTimeout(timer); remove(); });
}

export const toast = Object.assign(
  (message: string) => showToast(message, 'info'),
  {
    success: (message: string) => showToast(message, 'success'),
    error:   (message: string) => showToast(message, 'error'),
    warning: (message: string) => showToast(message, 'warning'),
    info:    (message: string) => showToast(message, 'info'),
  },
);
