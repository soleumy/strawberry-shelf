import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listUserCollections, createCollection, updateCollection, deleteCollection } from '../../lib/api/collections';

export function Collections() {
  const { userId } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', is_public: true });

  useEffect(() => {
    async function load() {
      if (!userId) { setLoading(false); return; }
      const { data } = await listUserCollections(userId);
      setCollections(data || []);
      setLoading(false);
    }
    load();
  }, [userId]);

  function startEdit(c) {
    setEditing(c?.id || null);
    setForm(c ? { name: c.name, description: c.description, is_public: c.is_public } : { name: '', description: '', is_public: true });
  }

  async function save(e) {
    e.preventDefault();
    if (editing) {
      await updateCollection(editing, form);
      setCollections((cur) => cur.map((c) => (c.id === editing ? { ...c, ...form } : c)));
    } else {
      const { data } = await createCollection({ ...form, owner_id: userId });
      if (data) setCollections((cur) => [data, ...cur]);
    }
    startEdit(null);
  }

  async function remove(id) {
    if (!confirm('Eliminar colección?')) return;
    await deleteCollection(id);
    setCollections((cur) => cur.filter((c) => c.id !== id));
  }

  if (loading) return <section className="reader-card">Cargando colecciones...</section>;

  return (
    <section className="reader-card">
      <div className="page-header-row">
        <div>
          <p className="reader-novel">Colecciones</p>
          <h1>Mis colecciones</h1>
        </div>
        <button className="primary-action" onClick={() => startEdit(null)}><Plus size={17} /> Nueva</button>
      </div>

      {editing !== null && (
        <form className="profile-form" onSubmit={save}>
          <label>Nombre
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </label>
          <label>Descripción
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </label>
          <label>
            <input type="checkbox" checked={form.is_public} onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))} /> Pública
          </label>
          <div className="form-actions">
            <button type="submit" className="primary-action">Guardar</button>
            <button type="button" className="secondary-action" onClick={() => startEdit(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="admin-list">
        {collections.map((c) => (
          <article key={c.id} className="admin-item">
            {c.cover_url && <img src={c.cover_url} alt={c.name} />}
            <div>
              <h3>{c.name}</h3>
              <p>{c.description}</p>
              <div className="admin-actions">
                <Link to={`/collection/${c.id}`} className="secondary-action"><Edit size={16} /> Ver</Link>
                <button type="button" onClick={() => startEdit(c)} className="secondary-action"><Edit size={16} /> Editar</button>
                <button type="button" onClick={() => remove(c.id)} className="secondary-action"><Trash2 size={16} /> Eliminar</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

    const { data } = await supabase
      .from('collections')
      .select('*, collection_items(count)')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });

    setCollections(data || []);
  }

  useEffect(() => {
    load();
  }, [session]);

  async function create(event) {
    event.preventDefault();

    const { error } = await supabase.from('collections').insert({
      user_id: session.user.id,
      name: form.name,
      description: form.description,
      is_public: form.is_public,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setForm({ name: '', description: '', is_public: true });
    setShowForm(false);
    load();
  }

  async function remove(id) {
    if (!confirm('¿Eliminar esta colección?')) return;
    await supabase.from('collections').delete().eq('id', id);
    load();
  }

  return (
    <section className="reader-card">
      <div className="page-header-row">
        <div>
          <p className="reader-novel">Colecciones</p>
          <h1>Mis listas</h1>
        </div>
        <button type="button" className="primary-action" onClick={() => setShowForm(!showForm)}>
          <Plus size={17} /> Nueva colección
        </button>
      </div>

      {showForm && (
        <form className="profile-form" onSubmit={create}>
          <label>
            Nombre
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Descripción
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="2" />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
            />
            Colección pública
          </label>
          <button type="submit" className="primary-action">Crear</button>
        </form>
      )}

      <div className="collections-grid">
        {collections.map((col) => (
          <article key={col.id} className="collection-card">
            <div
              className="collection-cover"
              style={{ backgroundImage: col.cover_url ? `url(${col.cover_url})` : undefined }}
            />
            <div>
              <h3>{col.name}</h3>
              <p>{col.description || 'Sin descripción'}</p>
              <span>{col.is_public ? 'Pública' : 'Privada'} · {col.collection_items?.[0]?.count || 0} novelas</span>
              <div className="admin-actions">
                <Link to={`/dashboard/collections/${col.id}`}>Ver</Link>
                <button type="button" onClick={() => remove(col.id)}>
                  <Trash2 size={15} /> Eliminar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {collections.length === 0 && !showForm && (
        <div className="empty-state">Crea tu primera colección.</div>
      )}

      {message && <p className="form-message">{message}</p>}
    </section>
  );
}
