import { useEffect, useState } from 'react';
import { getPage, updatePage } from '../../api/site';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Toast from '../../components/admin/Toast';
import FileUploadButton from '../../components/admin/FileUploadButton';
import '../../components/admin/adminShared.css';
import '../../components/forms.css';

const BLANK = { title: '', description: '', image: '' };

export default function ContactUsPage() {
    const [page, setPage] = useState(BLANK);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await getPage('contact-us');
                setPage({ ...BLANK, ...(data.page || {}) });
            } catch {
                setToast({ type: 'error', message: 'Failed to load Contact Us' });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const update = (patch) => setPage((p) => ({ ...p, ...patch }));

    const save = async () => {
        setSaving(true);
        try {
            const { data } = await updatePage('contact-us', page);
            setPage({ ...BLANK, ...(data.page || {}) });
            setToast({ type: 'success', message: 'Contact Us saved' });
        } catch {
            setToast({ type: 'error', message: 'Save failed' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <AdminPageHeader
                title="Contact Us"
                subtitle="Title, description and image for the salescode.ai Contact Us page."
            >
                <button className="btn-primary" onClick={save} disabled={saving || loading}>
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </AdminPageHeader>

            {loading ? (
                <div className="admin-loading">Loading…</div>
            ) : (
                <form className="config-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            value={page.title}
                            onChange={(e) => update({ title: e.target.value })}
                            placeholder="e.g. Get in touch"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={page.description}
                            onChange={(e) => update({ description: e.target.value })}
                            placeholder="Supporting text, contact hours, response SLA, etc."
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>Image</label>
                        {page.image && (
                            <img src={page.image} alt="" className="admin-media-thumb" />
                        )}
                        <div className="admin-actions-bar">
                            <FileUploadButton
                                label={page.image ? 'Replace' : 'Upload'}
                                accept="image/*"
                                onUploaded={(url) => update({ image: url })}
                                onError={(msg) => setToast({ type: 'error', message: msg })}
                            />
                            {page.image && (
                                <button type="button" className="btn-remove" onClick={() => update({ image: '' })}>
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="btn-save" disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </form>
            )}

            <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        </>
    );
}
