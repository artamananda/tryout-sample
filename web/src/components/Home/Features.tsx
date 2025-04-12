import React from 'react';

export const Features = (props: any) => {
  return (
    <div id="features" className="text-center">
      <div className="container" style={{ paddingBlock: 40 }}>
        <div className="col-md-10 col-md-offset-1 section-title">
          <h2>Fitur</h2>
        </div>
        <div className="row">
          {props.data
            ? props.data.map((d: any, i: number) => (
                <div key={`${d.title}-${i}`} className="col-xs-6 col-md-3">
                  {' '}
                  <i className={d.icon}></i>
                  <h3>{d.title}</h3>
                  <p>{d.text}</p>
                </div>
              ))
            : 'Loading...'}
        </div>
      </div>
    </div>
  );
};
