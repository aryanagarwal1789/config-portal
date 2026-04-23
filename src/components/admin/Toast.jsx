import { useEffect } from 'react';
import '../toast.css';

export default function Toast({ message, type = 'success', onClose, duration = 2500 }) {
    useEffect(() => {
        if (!message) return;
        const t = setTimeout(onClose, duration);
        return () => clearTimeout(t);
    }, [message, duration, onClose]);

    if (!message) return null;

    return (
        <div className={`toast toast-${type}`}>
            <span>{message}</span>
            <button className="toast-close" onClick={onClose} aria-label="Dismiss">×</button>
        </div>
    );
}
