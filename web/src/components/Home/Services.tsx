import React from 'react';

export const Services = (props: any) => {
  return (
    <div id="services" className="text-center">
      <div className="container">
        <div className="section-title">
          <h2>Layanan Kami</h2>
          <p>
            Kami juga menyediakan beberapa layanan yang merupakan{' '}
            <span style={{ fontStyle: 'italic' }}>core value</span> dari
            Telisik.
          </p>
        </div>
        <div className="row">
          {props.data
            ? props.data.map((d: any, i: number) => (
                <div key={`${d.name}-${i}`} className="col-md-4">
                  {' '}
                  <i className={d.icon}></i>
                  <div className="service-desc">
                    <h3>{d.name}</h3>
                    <p>{d.text}</p>
                  </div>
                </div>
              ))
            : 'loading'}
        </div>
      </div>
    </div>
  );
};
