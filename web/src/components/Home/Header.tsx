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
          </div>

          <div className="header-image">
            <img
              src={process.env.PUBLIC_URL + '/img/model.png'}
              alt="Vector Telisik"
              className="responsive-img"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
