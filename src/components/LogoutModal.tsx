// ─── LogoutModal ───────────────────────────────────────────────────────────────
interface LogoutModalProps {
  onLogout: () => void;
  onClose: () => void;
  error: string;
}

export function LogoutModal({ onLogout, onClose, error }: LogoutModalProps) {
  // const [val, setVal] = useState("");
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl p-7 w-95 border-2 border-reef-theme bg-reef-bg"
      >
        <h2
          className="mb-2 text-[34px] text-reef-theme tracking-widest"
          style={{ fontFamily: "'Jersey 15', sans-serif" }}
        >
          log out?
        </h2>
        {error && <p className="text-xs text-reef-theme mb-3">{error}</p>}
        <div className="flex gap-2.5">
          <button
            onClick={() => onLogout()}
            className="flex-1 py-2 rounded-md bg-reef-theme text-reef-button-text text-[12px] cursor-pointer hover:bg-reef-highlight transition-opacity disabled:opacity-60"
          >
            CONFIRM
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-reef-default text-reef-button-text text-[12px] cursor-pointer hover:bg-reef-highlight"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
