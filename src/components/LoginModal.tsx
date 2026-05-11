import { useState } from "react";

// ─── LoginModal ───────────────────────────────────────────────────────────────
interface LoginModalProps {
  onLogin: (token: string) => Promise<void>;
  onClose: () => void;
  error: string;
}

export function LoginModal({ onLogin, onClose, error }: LoginModalProps) {
  const [val, setVal] = useState("");
  const inputCls =
    "w-full px-2.5 py-2 border border-black text-[12px] outline-none mb-3.5";
  const labelCls =
    "block text-[10px] font-bold text-black lowercase tracking-wider mb-1";

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl p-7 w-95 border-2 border-reef-red bg-[#F5EFE0]"
      >
        <h2
          className="mb-2 text-[34px] text-reef-red tracking-widest"
          style={{ fontFamily: "'Jersey 15', sans-serif" }}
        >
          admin access
        </h2>
        <label className={labelCls}>TOKEN</label>
        <input
          className={inputCls}
          type="password"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onLogin(val)}
          autoFocus
        />
        {error && <p className="text-xs text-reef-red mb-3">{error}</p>}
        <div className="flex gap-2.5">
          <button
            onClick={() => onLogin(val)}
            className="flex-1 py-2 rounded-md bg-reef-red text-reef-cream text-[12px] cursor-pointer hover:bg-reef-blue transition-opacity disabled:opacity-60"
          >
            UNLOCK
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-reef-default text-reef-cream text-[12px] cursor-pointer hover:bg-reef-blue"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
