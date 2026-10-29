import React, { useState, useEffect, useCallback } from 'react';
import Reveal from './Reveal';

const fotosKairos = [
  {
    id: 1,
    jpg: '/images/kairos/kairos-fachada-principal.jpg',
    webp: '/images/kairos/kairos-fachada-principal.webp',
    title: 'Fachada Principal & Showroom',
    category: 'Estrutura',
    desc: 'Entrada principal moderna com estacionamento e identificação Kairós.'
  },
  {
    id: 2,
    jpg: '/images/kairos/kairos-salao-oficina.jpg',
    webp: '/images/kairos/kairos-salao-oficina.webp',
    title: 'Salão Técnico & Boxes com LED',
    category: 'Oficina',
    desc: 'Boxes de atendimento equipados e iluminação técnica de alta visibilidade.'
  },
  {
    id: 3,
    jpg: '/images/kairos/kairos-diagnostico-scanner.jpg',
    webp: '/images/kairos/kairos-diagnostico-scanner.webp',
    title: 'Diagnóstico Computadorizado',
    category: 'Mecânica',
    desc: 'Scanner automotivo avançado e análise eletrônica completa do motor.'
  },
  {
    id: 4,
    jpg: '/images/kairos/kairos-mecanica-motor.jpg',
    webp: '/images/kairos/kairos-mecanica-motor.webp',
    title: 'Precisão Mecânica & Cabeçotes',
    category: 'Mecânica',
    desc: 'Desmontagem, retífica e montagem precisa de motores.'
  },
  {
    id: 5,
    jpg: '/images/kairos/kairos-mecanico-toro.jpg',
    webp: '/images/kairos/kairos-mecanico-toro.webp',
    title: 'Mecânica Especializada em Ação',
    category: 'Equipe',
    desc: 'Profissionais experientes cuidando de cada detalhe do veículo.'
  },
  {
    id: 6,
    jpg: '/images/kairos/kairos-fachada-ampla.jpg',
    webp: '/images/kairos/kairos-fachada-ampla.webp',
    title: 'Estrutura Completa & Pátio',
    category: 'Estrutura',
    desc: 'Amplo espaço projetado para receber você e seu automóvel com conforto.'
  },
  {
    id: 7,
    jpg: '/images/kairos/kairos-patio-visao-aerea.jpg',
    webp: '/images/kairos/kairos-patio-visao-aerea.webp',
    title: 'Visão Panorâmica da Oficina',
    category: 'Oficina',
    desc: 'Visão geral do espaço técnico integrado e organizado.'
  },
  {
    id: 8,
    jpg: '/images/kairos/kairos-boxes-servico.jpg',
    webp: '/images/kairos/kairos-boxes-servico.webp',
    title: 'Área Técnica e Boxes de Manutenção',
    category: 'Oficina',
    desc: 'Bancadas limpas, piso de alta resistência e equipamentos de ponta.'
  },
  {
    id: 9,
    jpg: '/images/kairos/kairos-revisao-frota.jpg',
    webp: '/images/kairos/kairos-revisao-frota.webp',
    title: 'Revisão Preventiva & Frotas',
    category: 'Equipe',
    desc: 'Manutenção rigorosa para veículos de passeio, SUVs e utilitários.'
  },
  {
    id: 10,
    jpg: '/images/kairos/kairos-ferramental-oficina.jpg',
    webp: '/images/kairos/kairos-ferramental-oficina.webp',
    title: 'Ferramental Avançado',
    category: 'Estrutura',
    desc: 'Carros de ferramentas profissionais e instrumentação precisa.'
  }
];

const categorias = ['Todas', 'Estrutura', 'Oficina', 'Mecânica', 'Equipe'];

const Gallery = () => {
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const fotosFiltradas = categoriaAtiva === 'Todas'
    ? fotosKairos
    : fotosKairos.filter((f) => f.category === categoriaAtiva);

  const handlePrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : fotosFiltradas.length - 1));
  }, [lightboxIndex, fotosFiltradas.length]);

  const handleNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev < fotosFiltradas.length - 1 ? prev + 1 : 0));
  }, [lightboxIndex, fotosFiltradas.length]);

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
      <Reveal style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span className="eyebrow" style={{ justifyContent: 'center' }}>Nossa Estrutura Real</span>
        <h2 className="section-title">Cuidado de perto<br />com o seu veículo</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '12px', maxWidth: '640px', marginInline: 'auto' }}>
          Conheça o espaço físico, ferramental tecnológico e a equipe que cuidam do seu carro no Kairós Centro Automotivo.
        </p>

        {/* Filtros de categoria */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          justifyContent: 'center',
          marginTop: '28px'
        }}>
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategoriaAtiva(cat);
                setLightboxIndex(null);
              }}
              style={{
                background: categoriaAtiva === cat ? 'var(--accent-color)' : 'rgba(255,255,255,0.04)',
                color: categoriaAtiva === cat ? '#fff' : 'var(--text-muted)',
                border: '1px solid ' + (categoriaAtiva === cat ? 'var(--accent-color)' : 'var(--hairline)'),
                padding: '7px 16px',
                borderRadius: '999px',
                fontSize: '0.86rem',
                fontWeight: categoriaAtiva === cat ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Grid de fotos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {fotosFiltradas.map((foto, idx) => (
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
                  alt={foto.title}
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

              {/* Overlay com gradiente e informações */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '20px',
                  transition: 'opacity 0.3s ease',
                  opacity: 0.95
                }}
              >
                <span style={{
                  alignSelf: 'flex-start',
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: '700',
                  color: 'var(--accent-color)',
                  background: 'rgba(229,46,46,0.12)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  border: '1px solid rgba(229,46,46,0.3)'
                }}>
                  {foto.category}
                </span>
                <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                  {foto.title}
                </h4>
                <p style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.8rem',
                  margin: '6px 0 0 0',
                  lineHeight: '1.3'
                }}>
                  {foto.desc}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && fotosFiltradas[lightboxIndex] && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          {/* Botão Fechar */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              fontSize: '28px',
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
            style={{
              position: 'absolute',
              left: '20px',
              background: 'rgba(255,255,255,0.1)',
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

          {/* Conteúdo Imagem */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <picture>
              <source srcSet={fotosFiltradas[lightboxIndex].webp} type="image/webp" />
              <img
                src={fotosFiltradas[lightboxIndex].jpg}
                alt={fotosFiltradas[lightboxIndex].title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              />
            </picture>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', margin: 0, fontWeight: '600' }}>
                {fotosFiltradas[lightboxIndex].title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
                {fotosFiltradas[lightboxIndex].desc}
              </p>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
                {lightboxIndex + 1} de {fotosFiltradas.length}
              </span>
            </div>
          </div>

          {/* Botão Próximo */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            style={{
              position: 'absolute',
              right: '20px',
              background: 'rgba(255,255,255,0.1)',
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
          transform: scale(1.06);
        }
      `}</style>
    </section>
  );
};

export default Gallery;
