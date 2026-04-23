import { useEffect, useState } from 'react';
import { getPage, updatePage } from '../../api/site';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Toast from '../../components/admin/Toast';
import FileUploadButton from '../../components/admin/FileUploadButton';
import '../../components/admin/adminShared.css';
import '../../components/forms.css';

const BLANK = { title: '', description: '', bannerImage: '', video: '' };

export default function AboutUsPage() {
    const [page, setPage] = useState(BLANK);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [justUploadedVideo, setJustUploadedVideo] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await getPage('about-us');
                setPage({ ...BLANK, ...(data.page || {}) });
            } catch {
                setToast({ type: 'error', message: 'Failed to load About Us' });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const update = (patch) => setPage((p) => ({ ...p, ...patch }));

    const save = async () => {
        setSaving(true);
        try {
            const { data } = await updatePage('about-us', page);
            setPage({ ...BLANK, ...(data.page || {}) });
            setToast({ type: 'success', message: 'About Us saved' });
        } catch {
            setToast({ type: 'error', message: 'Save failed' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <AdminPageHeader
                title="About Us"
                subtitle="Title, description, banner image and video for the salescode.ai About Us page."
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
                            placeholder="e.g. About SalesCode"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={page.description}
                            onChange={(e) => update({ description: e.target.value })}
                            placeholder="Paragraph describing the company, mission and team"
                            rows={3}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Banner image</label>
                            <div className="admin-actions-bar">
                                {page.bannerImage && <img src={page.bannerImage} alt="" className="admin-item-thumb-sm" />}
                                <input
                                    value={page.bannerImage}
                                    onChange={(e) => update({ bannerImage: e.target.value })}
                                    placeholder="https://… or upload"
                                />
                                <FileUploadButton
                                    label="Upload"
                                    accept="image/*"
                                    onUploaded={(url) => update({ bannerImage: url })}
                                    onError={(msg) => setToast({ type: 'error', message: msg })}
                                />
                                {page.bannerImage && (
                                    <button type="button" className="btn-remove" onClick={() => update({ bannerImage: '' })}>
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Video</label>
                            <div className="admin-actions-bar">
                                {page.video && (
                                    <video
                                        key={page.video}
                                        src={page.video}
                                        controls
                                        autoPlay={justUploadedVideo}
                                        muted={justUploadedVideo}
                                        className="admin-item-thumb-sm is-video"
                                        style={{ width: 60, height: 44, objectFit: 'cover' }}
                                    />
                                )}
                                <input
                                    value={page.video}
                                    onChange={(e) => { update({ video: e.target.value }); setJustUploadedVideo(false); }}
                                    placeholder="https://… or upload"
                                />
                                <FileUploadButton
                                    label="Upload"
                                    accept="video/*"
                                    onUploaded={(url) => { update({ video: url }); setJustUploadedVideo(true); }}
                                    onError={(msg) => setToast({ type: 'error', message: msg })}
                                />
                                {page.video && (
                                    <button type="button" className="btn-remove" onClick={() => { update({ video: '' }); setJustUploadedVideo(false); }}>
                                        Clear
                                    </button>
                                )}
                            </div>
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
