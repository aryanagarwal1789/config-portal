import { useState, useEffect } from 'react';
import './forms.css';

export default function SEOForm({ initialData, onSave, loading }) {
    const [form, setForm] = useState({
        title: '',
        description: '',
        keywords: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: ''
    });

    useEffect(() => {
        if (initialData) {
            setForm({
                ...initialData,
                keywords: Array.isArray(initialData.keywords)
                    ? initialData.keywords.join(', ')
                    : initialData.keywords || ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean)
        });
    };

    return (
        <form className="config-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Page Title</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="Page title" />
            </div>
            <div className="form-group">
                <label>Meta Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Meta description" />
            </div>
            <div className="form-group">
                <label>Keywords <span className="hint">(comma-separated)</span></label>
                <input name="keywords" value={form.keywords} onChange={handleChange} placeholder="keyword1, keyword2" />
            </div>
            <div className="form-divider">Open Graph</div>
            <div className="form-group">
                <label>OG Title</label>
                <input name="ogTitle" value={form.ogTitle} onChange={handleChange} placeholder="OG title" />
            </div>
            <div className="form-group">
                <label>OG Description</label>
                <textarea name="ogDescription" value={form.ogDescription} onChange={handleChange} rows={3} placeholder="OG description" />
            </div>
            <div className="form-group">
                <label>OG Image URL</label>
                <input name="ogImage" value={form.ogImage} onChange={handleChange} placeholder="https://..." />
            </div>
            <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving…' : 'Save Changes'}
            </button>
        </form>
    );
}
