import React from 'react';

export const Team = (props: { data: any[] }) => {
  const defaultImg = 'img/team/default.jpg';

  return (
    <div id="team" className="text-center">
      <div className="container">
        <div className="col-md-8 col-md-offset-2 section-title">
          <h2>TIM Telisik</h2>
          <p>
            Berikut adalah tim yang terlibat dalam pengembangan Telisik. Mereka
            adalah insan yang peduli terhadap kemajuan teknologi dan pendidikan
            di Indonesia. Dengan latar belakang yang beragam, mereka bersatu
            untuk menciptakan platform yang bermanfaat bagi masyarakat. Mari
            kita kenali mereka lebih dekat!
          </p>
        </div>
        <div id="row">
          {props.data
            ? props.data.map((d, i) => (
                <div key={`${d.name}-${i}`} className="col-md-3 col-sm-6 team">
                  <div className="thumbnail">
                    <img
                      src={d.img || defaultImg}
                      alt={d.name}
                      className="team-img"
                      onError={(e) => {
                        e.currentTarget.src = defaultImg;
                      }}
                    />
                    <div className="caption">
                      <h4>{d.name}</h4>
                      <p>{d.job}</p>
                      <p>{d.university}</p>
                    </div>
                  </div>
                </div>
              ))
            : 'loading'}
        </div>
      </div>
    </div>
  );
};
