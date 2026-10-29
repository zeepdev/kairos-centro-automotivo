import React, { useState, useEffect, useCallback } from 'react';
import Reveal from './Reveal';

const fotosKairos = [
  {
    id: 1,
    jpg: '/images/kairos/kairos-fachada-principal.jpg',
    webp: '/images/kairos/kairos-fachada-principal.webp',
    alt: 'Fachada Kairós Centro Automotivo'
  },
  {
    id: 2,
    jpg: '/images/kairos/kairos-salao-oficina.jpg',
    webp: '/images/kairos/kairos-salao-oficina.webp',
    alt: 'Estrutura técnica e boxes com iluminação LED'
  },
  {
    id: 3,
    jpg: '/images/kairos/kairos-diagnostico-scanner.jpg',
    webp: '/images/kairos/kairos-diagnostico-scanner.webp',
    alt: 'Diagnóstico computadorizado e scanner'
  },
  {
    id: 4,
    jpg: '/images/kairos/kairos-mecanica-motor.jpg',
    webp: '/images/kairos/kairos-mecanica-motor.webp',
    alt: 'Precisão mecânica e desmontagem de motor'
  },
  {
    id: 5,
    jpg: '/images/kairos/kairos-mecanico-toro.jpg',
    webp: '/images/kairos/kairos-mecanico-toro.webp',
    alt: 'Manutenção especializada em veículo'
  },
  {
    id: 6,
    jpg: '/images/kairos/kairos-fachada-ampla.jpg',
    webp: '/images/kairos/kairos-fachada-ampla.webp',
    alt: 'Estrutura ampla e pátio'
  },
  {
    id: 7,
    jpg: '/images/kairos/kairos-patio-visao-aerea.jpg',
    webp: '/images/kairos/kairos-patio-visao-aerea.webp',
    alt: 'Visão panorâmica da oficina'
  },
  {
    id: 8,
    jpg: '/images/kairos/kairos-revisao-frota.jpg',
    webp: '/images/kairos/kairos-revisao-frota.webp',
    alt: 'Revisão preventiva de veículos'
  },
  {
    id: 9,
    jpg: '/images/kairos/kairos-ferramental-oficina.jpg',
    webp: '/images/kairos/kairos-ferramental-oficina.webp',
    alt: 'Ferramental e bancada profissional'
  }
];

const Gallery = () => {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const handlePrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : fotosKairos.length - 1));
  }, [lightboxIndex]);

  const handleNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev < fotosKairos.length - 1 ? prev + 1 : 0));
  }, [lightboxIndex]);

  const handleClose = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handleClose, handlePrev, handleNext]);

  return (
    <section id="estrutura" className="container" style={{ paddingTop: '80px', paddingBottom: '90px' }}>
      <Reveal style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span className="eyebrow" style={{ justifyContent: 'center' }}>Nossa Estrutura</span>
        <h2 className="section-title">Cuidado de perto<br />com o seu veículo</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '12px', maxWidth: '640px', marginInline: 'auto' }}>
          Conheça nosso espaço e o cuidado com cada detalhe do seu carro.
        </p>
      </Reveal>

      {/* Grid limpo sem legendas cobrindo as fotos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {fotosKairos.map((foto, idx) => (
          <Reveal
            key={foto.id}
            delay={(idx % 6) * 70}
            style={{
              overflow: 'hidden',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              aspectRatio: '4/5',
              border: '1px solid var(--hairline)',
              position: 'relative',
              cursor: 'pointer',
              background: '#0d0d10'
            }}
          >
            <div
              onClick={() => setLightboxIndex(idx)}
              style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
              className="gallery-item-wrapper"
            >
              <picture>
                <source srcSet={foto.webp} type="image/webp" />
                <img
                  src={foto.jpg}
                  alt={foto.alt}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                    display: 'block'
                  }}
                  className="gallery-thumb"
                />
              </picture>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Lightbox Modal Minimalista */}
      {lightboxIndex !== null && fotosKairos[lightboxIndex] && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.94)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          {/* Botão Fechar */}
          <button
            onClick={handleClose}
            aria-label="Fechar"
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              color: '#fff',
              fontSize: '26px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              zIndex: 10
            }}
          >
            ✕
          </button>

          {/* Botão Anterior */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Anterior"
            style={{
              position: 'absolute',
              left: '20px',
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              color: '#fff',
              fontSize: '26px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              zIndex: 10
            }}
          >
            ‹
          </button>

          {/* Foto em tela cheia */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <picture>
              <source srcSet={fotosKairos[lightboxIndex].webp} type="image/webp" />
              <img
                src={fotosKairos[lightboxIndex].jpg}
                alt={fotosKairos[lightboxIndex].alt}
                style={{
                  maxWidth: '100%',
                  maxHeight: '86vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              />
            </picture>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', marginTop: '12px' }}>
              {lightboxIndex + 1} / {fotosKairos.length}
            </span>
          </div>

          {/* Botão Próximo */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Próximo"
            style={{
              position: 'absolute',
              right: '20px',
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              color: '#fff',
              fontSize: '26px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              zIndex: 10
            }}
          >
            ›
          </button>
        </div>
      )}

      <style>{`
        .gallery-item-wrapper:hover .gallery-thumb {
          transform: scale(1.05);
        }
      `}</style>
    </section>
  );
};

export default Gallery;
