import React from 'react';
import GradientText from './GradientText';

export const Header = (props: any) => {
  return (
    <header id="header">
      <div className="intro">
        <div className="overlay">
          <div className="container">
            <div className="row">
              <div className="col-md-8 col-md-offset-2 intro-text">
                <GradientText>
                  {props.data ? props.data.title : 'Loading'}
                </GradientText>
                <p>{props.data ? props.data.paragraph : 'Loading'}</p>
                <a href="#about" className="btn btn-custom btn-lg page-scroll">
                  SELENGKAPNYA
                </a>{' '}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
