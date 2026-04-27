import { useState } from 'react';
import './adminSection.css';

function Caret({ open }) {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{
                transition: 'transform 0.2s',
                transform: open ? 'rotate(90deg)' : 'rotate(0deg)'
            }}
        >
            <path
                d="M5 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/**
 * A collapsible section with a tray-like background. Children render inside an
 * elevated "tray" that contrasts with admin-item-cards (white) inside it — so
 * the visual hierarchy "container → items" is obvious at a glance.
 *
 * Props:
 *   title         — plain text heading (ignored if `titleInput` is given)
 *   titleInput    — React node for an editable title (e.g. an <input>)
 *   description   — optional subhead under the header
 *   badge         — optional badge content rendered beside actions (e.g. count)
 *   actions       — optional right-side action buttons (won't trigger collapse)
 *   collapsible   — default true; when false the caret is hidden
 *   defaultOpen   — default true
 *   children      — section body
 */
export default function AdminSection({
    title,
    titleInput,
    description,
    badge,
    actions,
    collapsible = true,
    defaultOpen = true,
    accent = 'indigo', // indigo | purple | pink | cyan | emerald
    children
}) {
    const [open, setOpen] = useState(defaultOpen);
    const toggle = () => {
        if (collapsible) setOpen((v) => !v);
    };
    const stop = (e) => e.stopPropagation();

    return (
        <section className={`admin-section accent-${accent} ${open || !collapsible ? 'is-open' : 'is-collapsed'}`}>
            <div
                className={`admin-section-header ${collapsible ? 'is-clickable' : ''}`}
                onClick={toggle}
                role={collapsible ? 'button' : undefined}
                tabIndex={collapsible ? 0 : undefined}
                aria-expanded={collapsible ? open : undefined}
                onKeyDown={(e) => {
                    if (!collapsible) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle();
                    }
                }}
            >
                {collapsible && (
                    <span className="admin-section-caret" aria-hidden>
                        <Caret open={open} />
                    </span>
                )}
                <div
                    className="admin-section-heading"
                    onClick={titleInput ? stop : undefined}
                    onKeyDown={titleInput ? stop : undefined}
                >
                    {titleInput || <h3 className="admin-section-title">{title}</h3>}
                </div>
                {(badge || actions) && (
                    <div className="admin-section-actions" onClick={stop}>
                        {badge && <span className="admin-section-badge">{badge}</span>}
                        {actions}
                    </div>
                )}
            </div>
            {(open || !collapsible) && (
                <div className="admin-section-body">
                    {description && <p className="admin-section-desc">{description}</p>}
                    {children}
                </div>
            )}
        </section>
    );
}
