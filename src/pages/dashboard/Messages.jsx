import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export function Messages() {
  const { session } = useAuth();
  const [messages, setMessages] = useState([]);
  const [compose, setCompose] = useState({ recipient_id: '', subject: '', body: '' });
  const [activeTab, setActiveTab] = useState('inbox');
  const [message, setMessage] = useState('');

  async function load() {
    if (!session?.user) return;

    const column = activeTab === 'inbox' ? 'recipient_id' : 'sender_id';

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq(column, session.user.id)
      .order('created_at', { ascending: false });

    setMessages(data || []);
  }

  useEffect(() => {
    load();
  }, [session, activeTab]);

  async function send(event) {
    event.preventDefault();

    const { error } = await supabase.from('messages').insert({
      sender_id: session.user.id,
      recipient_id: compose.recipient_id,
      subject: compose.subject,
      body: compose.body,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    await supabase.from('notifications').insert({
      user_id: compose.recipient_id,
      type: 'message',
      title: 'Nuevo mensaje',
      body: compose.subject || 'Tienes un mensaje nuevo.',
      actor_id: session.user.id,
    });

    setCompose({ recipient_id: '', subject: '', body: '' });
    setMessage('Mensaje enviado.');
    load();
  }

  async function markRead(id) {
    await supabase.from('messages').update({ is_read: true }).eq('id', id);
    load();
  }

  return (
    <section className="reader-card">
      <p className="reader-novel"><Mail size={16} /> Mensajes</p>
      <h1>Inbox</h1>

      <div className="library-tabs">
        <button type="button" className={activeTab === 'inbox' ? 'active' : ''} onClick={() => setActiveTab('inbox')}>
          Recibidos
        </button>
        <button type="button" className={activeTab === 'sent' ? 'active' : ''} onClick={() => setActiveTab('sent')}>
          Enviados
        </button>
        <button type="button" className={activeTab === 'compose' ? 'active' : ''} onClick={() => setActiveTab('compose')}>
          Nuevo
        </button>
      </div>

      {activeTab === 'compose' ? (
        <form className="profile-form" onSubmit={send}>
          <label>
            ID del destinatario
            <input
              value={compose.recipient_id}
              onChange={(e) => setCompose({ ...compose, recipient_id: e.target.value })}
              required
              placeholder="UUID del usuario"
            />
          </label>
          <label>
            Asunto
            <input value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} />
          </label>
          <label>
            Mensaje
            <textarea value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} rows="5" required />
          </label>
          <button type="submit" className="primary-action">
            <Send size={17} /> Enviar
          </button>
        </form>
      ) : (
        <div className="messages-list">
          {messages.map((msg) => (
            <article key={msg.id} className={`message-item ${msg.is_read ? 'read' : ''}`} onClick={() => markRead(msg.id)}>
              <strong>{msg.subject || 'Sin asunto'}</strong>
              <p>{msg.body.slice(0, 120)}{msg.body.length > 120 ? '...' : ''}</p>
              <time>{new Date(msg.created_at).toLocaleString('es')}</time>
            </article>
          ))}

          {messages.length === 0 && <div className="empty-state">No hay mensajes.</div>}
        </div>
      )}

      {message && <p className="form-message">{message}</p>}
    </section>
  );
}
