import { useState, useEffect } from 'react';
import NavbarPagesConfig from './NavbarPagesConfig';
import './forms.css';

export default function PublicConfigForm({ initialData, onSave, loading, allProducts = [] }) {
    const [pages, setPages] = useState([]);

    useEffect(() => {
        if (initialData?.navbar?.pages) {
            setPages(initialData.navbar.pages);
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...initialData, navbar: { ...initialData?.navbar, pages } });
    };

    return (
        <form className="config-form" onSubmit={handleSubmit}>
            <section className="form-section">
                <h3 className="section-title">Topbar Pages</h3>
                <p className="section-desc">
                    Drag pages to reorder · toggle to show/hide a page · select a page to configure its sections
                </p>
                <NavbarPagesConfig pages={pages} onChange={setPages} allProducts={allProducts} />
            </section>

            <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving…' : 'Save Changes'}
            </button>
        </form>
    );
}
