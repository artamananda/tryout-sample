import React from 'react';
import { useNavigate } from 'react-router-dom';

export const SKDBanner = () => {
  const navigate = useNavigate();

  return (
    <section
      style={{
        background:
          'linear-gradient(135deg, #1a3a6e 0%, #154ab1 50%, #f6a800 100%)',
        padding: '60px 0',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* decorative circles */}
      <div
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -40,
          left: '30%',
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none'
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12
          }}
        >
          <span
            style={{
              background: '#f6a800',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 20,
              letterSpacing: 1,
              textTransform: 'uppercase'
            }}
          >
            Baru Tersedia
          </span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            Bank Soal SKD CPNS
          </span>
        </div>

        <h2
          style={{
            color: '#fff',
            fontSize: 28,
            fontWeight: 800,
            margin: '0 0 12px',
            lineHeight: 1.3
          }}
        >
          Persiapkan Diri untuk Seleksi CPNS 🎯
        </h2>

        <p
          style={{
            color: 'rgba(255,255,255,0.82)',
            fontSize: 15,
            maxWidth: 560,
            margin: '0 0 28px',
            lineHeight: 1.7
          }}
        >
          Bank Soal SKD CPNS sudah tersedia! Latihan soal{' '}
          <strong style={{ color: '#ffd700' }}>TWK</strong>,{' '}
          <strong style={{ color: '#ffd700' }}>TIU</strong>, dan{' '}
          <strong style={{ color: '#ffd700' }}>TKP</strong> yang dibuat dengan
          AI dan dikurasi sesuai standar BKN. Gratis dan bisa diakses kapan
          saja.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/bank-soal/skd-cpns')}
            style={{
              background: '#f6a800',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 28px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(246,168,0,0.45)',
              transition: 'transform 0.15s'
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = 'translateY(-2px)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = 'translateY(0)')
            }
          >
            Mulai Latihan SKD CPNS →
          </button>
          {/* <button
            onClick={() => navigate('/bank-soal/utbk')}
            style={{
              background: 'rgba(255,255,255,0.12)', color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.35)',
              borderRadius: 8, padding: '12px 28px',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          >
            Bank Soal UTBK
          </button> */}
        </div>

        {/* subtest chips */}
        <div
          style={{ display: 'flex', gap: 8, marginTop: 28, flexWrap: 'wrap' }}
        >
          {[
            { code: 'TWK', label: 'Tes Wawasan Kebangsaan' },
            { code: 'TIU', label: 'Tes Intelegensia Umum' },
            { code: 'TKP', label: 'Tes Karakteristik Pribadi' }
          ].map(({ code, label }) => (
            <div
              key={code}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                padding: '6px 14px'
              }}
            >
              <span style={{ color: '#ffd700', fontWeight: 800, fontSize: 13 }}>
                {code}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
