import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '📖', label: 'E-Book Digital', desc: 'Ratusan koleksi buku siap dibaca' },
  { icon: '🔍', label: 'Katalog Online', desc: 'Pencarian cepat & mudah' },
  { icon: '🌐', label: 'Open Access', desc: 'Gratis, terbuka untuk semua' },
  { icon: '📱', label: 'Multi-Perangkat', desc: 'Akses dari HP & komputer' }
];

export const ELibraryBanner = () => {
  const navigate = useNavigate();

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, #04073B 0%, #0c1a6b 55%, #1a3a8f 100%)',
        padding: '72px 24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 320, height: 320, borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: -60, left: '15%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(246,168,0,0.06)', pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(246,168,0,0.15)', border: '1px solid rgba(246,168,0,0.3)',
            borderRadius: 20, padding: '6px 16px', marginBottom: 20
          }}>
            <span style={{ fontSize: 14 }}>📚</span>
            <span style={{ color: '#f6a800', fontSize: 13, fontWeight: 600 }}>
              Perpustakaan Digital
            </span>
          </div>

          <h2 style={{
            color: '#fff',
            fontSize: 'clamp(24px, 3.5vw, 38px)',
            fontWeight: 800,
            margin: '0 0 16px 0',
            lineHeight: 1.25
          }}>
            Akses Koleksi Buku Digital<br />
            <span style={{ color: '#f6a800' }}>Kapan Saja, Di Mana Saja</span>
          </h2>

          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 16,
            maxWidth: 560,
            margin: '0 auto 36px auto',
            lineHeight: 1.7
          }}>
            Perpustakaan digital Telisik menyediakan koleksi e-book berkualitas yang dapat
            diakses secara gratis. Dukung literasi digitalmu sekarang.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/library')}
              style={{
                background: '#f6a800',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '14px 32px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(246,168,0,0.4)',
                transition: 'transform 0.15s, box-shadow 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(246,168,0,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(246,168,0,0.4)';
              }}
            >
              Jelajahi Perpustakaan →
            </button>
            <button
              onClick={() => navigate('/library')}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.85)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                borderRadius: 8,
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
              }}
            >
              Pelajari Lebih Lanjut
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16
        }}>
          {FEATURES.map((f) => (
            <div
              key={f.label}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '20px 20px',
                backdropFilter: 'blur(4px)',
                transition: 'background 0.2s, border-color 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(246,168,0,0.4)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                {f.label}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Open access badge */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginTop: 32, gap: 24, flexWrap: 'wrap'
        }}>
          {['Open Access', 'Literasi Digital', 'Gratis Selamanya'].map((badge) => (
            <div key={badge} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: 'rgba(255,255,255,0.5)', fontSize: 12
            }}>
              <span style={{ color: '#f6a800' }}>✓</span>
              {badge}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
