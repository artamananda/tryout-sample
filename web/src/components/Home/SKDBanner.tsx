import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'skd_banner_dismissed';

export const SKDBanner = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  // useEffect(() => {
  //   if (!localStorage.getItem(STORAGE_KEY)) {
  //     const timer = setTimeout(() => setIsOpen(true), 800);
  //     return () => clearTimeout(timer);
  //   }
  // }, []);

  const handleClose = () => {
    setIsOpen(false);
    // localStorage.setItem(STORAGE_KEY, '1');
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={handleClose}
    >
      {/* overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(3px)'
        }}
      />

      {/* modal */}
      <div
        style={{
          position: 'relative',
          background:
            'linear-gradient(135deg, #1a3a6e 0%, #154ab1 55%, #f6a800 100%)',
          borderRadius: 16,
          padding: '40px 36px 36px',
          maxWidth: 520,
          width: '100%',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          animation: 'popupIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -30,
            left: '25%',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none'
          }}
        />

        {/* close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
            borderRadius: '50%',
            width: 32,
            height: 32,
            fontSize: 18,
            lineHeight: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')
          }
        >
          ×
        </button>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14
            }}
          >
            <span
              style={{
                background: '#ff3b3b',
                color: '#fff',
                fontSize: 10,
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
              fontSize: 24,
              fontWeight: 800,
              margin: '0 0 12px',
              lineHeight: 1.3
            }}
          >
            Persiapkan Diri untuk Seleksi CPNS 2026! 🎯
          </h2>

          <p
            style={{
              color: 'rgba(255,255,255,0.82)',
              fontSize: 14,
              maxWidth: 440,
              margin: '0 0 24px',
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

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                handleClose();
                navigate('/bank-soal/skd-cpns');
              }}
              style={{
                background: '#f6a800',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 26px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(246,168,0,0.5)',
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
            <button
              onClick={handleClose}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.35)',
                borderRadius: 8,
                padding: '12px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')
              }
            >
              Nanti saja
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 22,
              flexWrap: 'wrap'
            }}
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
                  padding: '5px 12px'
                }}
              >
                <span
                  style={{ color: '#ffd700', fontWeight: 800, fontSize: 12 }}
                >
                  {code}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
};
