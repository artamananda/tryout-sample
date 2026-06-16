import React from 'react';
import GradientText from './GradientText';
import Typewriter from 'typewriter-effect';
import './Header.css';

export const Header = (props: any) => {
  return (
    <header id="header" className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-text">
            <GradientText>
              {props.data ? props.data.title : 'Loading'}
            </GradientText>
            <div
              style={{
                color: '#fff',
                marginTop: 10,
                marginBottom: 30,
                fontSize: 16
              }}
            >
              <Typewriter
                options={{
                  strings: [props.data ? props.data.paragraph : 'Loading'],
                  autoStart: true,
                  loop: true
                }}
              />
            </div>
            {/* <p>{props.data ? props.data.paragraph : 'Loading'}</p> */}
            <div className="header-buttons">
              <a href="#about" className="btn btn-custom page-scroll">
                SELENGKAPNYA
              </a>
              <a href="/tryout" className="btn btn-custom page-scroll">
                TRYOUT ONLINE
              </a>
            </div>
            <div className="header-buttons">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <span
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    background: '#ff3b3b',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 10,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    zIndex: 1,
                    boxShadow: '0 2px 6px rgba(255,59,59,0.5)',
                    animation: 'badgePulse 1.5s ease-in-out infinite'
                  }}
                >
                  NEW
                </span>
                <a
                  href="/bank-soal/skd-cpns"
                  className="btn btn-custom page-scroll"
                >
                  BANK SOAL SKD CPNS
                </a>
              </div>
            </div>
          </div>

          <div className="header-image">
            <img
              src={'/img/model.png'}
              alt="Vector Telisik"
              className="responsive-img"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
