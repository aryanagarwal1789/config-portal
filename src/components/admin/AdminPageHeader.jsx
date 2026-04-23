import './adminShared.css';

export default function AdminPageHeader({ title, subtitle, children }) {
    return (
        <div className="admin-page-header">
            <div className="admin-page-header-text">
                <h1 className="admin-page-title">{title}</h1>
                {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
            </div>
            {children && <div className="admin-page-header-actions">{children}</div>}
        </div>
    );
}
