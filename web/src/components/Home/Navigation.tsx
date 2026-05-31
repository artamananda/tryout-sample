import { Dropdown, MenuProps, message } from 'antd';
import React from 'react';
import { useSignOut, useAuthUser } from 'react-auth-kit';
import { useNavigate } from 'react-router-dom';
import {
  DownOutlined,
  PoweroffOutlined,
  UserOutlined
} from '@ant-design/icons';

export const Navigation = (props: any) => {
  const [isNavOpen, setIsNavOpen] = React.useState(false);
  const signOut = useSignOut();
  const userAuth = useAuthUser();
  const authName: string = userAuth() ? userAuth()?.name : null;
  const navigate = useNavigate();

  const bankSoalMenuItems: MenuProps['items'] = [
    {
      key: 'utbk',
      label: (
        <a href="/bank-soal/utbk">
          <span style={{ fontWeight: 600 }}>Bank Soal UTBK</span>
          <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
            KPU · PPU · PBM · PKU · IND · ING · MTK
          </div>
        </a>
      )
    },
    {
      key: 'skd',
      label: (
        <a href="/bank-soal/skd-cpns">
          <span style={{ fontWeight: 600 }}>
            Bank Soal SKD CPNS{' '}
            <span
              style={{
                background: '#f6a800',
                color: '#fff',
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 8,
                fontWeight: 700,
                marginLeft: 4,
                verticalAlign: 'middle'
              }}
            >
              BARU
            </span>
          </span>
          <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
            TWK · TIU · TKP
          </div>
        </a>
      )
    }
  ];

  const secondaryMenuItems: MenuProps['items'] = [
    {
      key: 'portfolio',
      label: <a href="/#portfolio">Galeri</a>
    },
    {
      key: 'testimonials',
      label: <a href="/#testimonials">Testimoni</a>
    },
    {
      key: 'team',
      label: <a href="/#team">Tim</a>
    },
    {
      key: 'contact',
      label: <a href="/#contact">Kontak</a>
    }
  ];

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <text
          onClick={() => {
            navigate('/dashboard');
          }}
        >
          Dashboard
        </text>
      )
    },
    {
      key: '2',
      icon: <PoweroffOutlined style={{ color: 'red' }} />,
      label: (
        <text
          onClick={() => {
            signOut();
            navigate('/');
            message.success("You've been signed out");
          }}
          style={{ color: 'red' }}
        >
          Logout
        </text>
      )
    }
  ];

  const toggleNavbar = () => {
    setIsNavOpen(!isNavOpen);
  };
  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
      <div className="container">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#bs-example-navbar-collapse-1"
            onClick={toggleNavbar}
          >
            {' '}
            <span className="sr-only">Toggle navigation</span>{' '}
            <span className="icon-bar"></span>{' '}
            <span className="icon-bar"></span>{' '}
            <span className="icon-bar"></span>{' '}
          </button>
          <a className=" page-scroll" href="#header">
            <img
              src={'/img/logo.png'}
              style={{
                height: 50
              }}
              alt={'logo'}
            />
          </a>
        </div>

        <div
          className={`navbar-collapse ${isNavOpen ? 'in' : 'collapse'}`}
          id="bs-example-navbar-collapse-1"
        >
          <ul className="nav navbar-nav navbar-right">
            {/* <li>
              <a href="#features" className="page-scroll">
                Fitur
              </a>
            </li> */}
            <li>
              <a href="/#about" className="page-scroll">
                Tentang
              </a>
            </li>
            <li>
              <a href="/#services" className="page-scroll">
                Layanan
              </a>
            </li>
            <li>
              <a href="/library" className="page-scroll">
                Perpustakaan Digital
              </a>
            </li>
            <li>
              <Dropdown
                menu={{ items: bankSoalMenuItems }}
                placement="bottomLeft"
                trigger={['click']}
                overlayClassName="home-nav-dropdown"
              >
                <a
                  className="page-scroll nav-menu-trigger"
                  onClick={(e) => e.preventDefault()}
                >
                  Bank Soal <DownOutlined style={{ marginLeft: 6 }} />
                </a>
              </Dropdown>
            </li>
            <li>
              <Dropdown
                menu={{ items: secondaryMenuItems }}
                placement="bottomLeft"
                trigger={['click']}
                overlayClassName="home-nav-dropdown"
              >
                <a
                  className="page-scroll nav-menu-trigger"
                  onClick={(event) => event.preventDefault()}
                >
                  Lainnya <DownOutlined style={{ marginLeft: 6 }} />
                </a>
              </Dropdown>
            </li>
            <li>
              {authName ? (
                <a className="page-scroll">
                  <Dropdown menu={{ items }} placement="bottomLeft">
                    <div>
                      <UserOutlined style={{ marginRight: 5 }} />
                      {authName?.slice(0, 12)}{' '}
                      <DownOutlined style={{ marginLeft: 10 }} />
                    </div>
                  </Dropdown>
                </a>
              ) : (
                <a
                  href="/login"
                  className="page-scroll"
                  style={{ color: 'black', fontWeight: 800 }}
                >
                  Login
                </a>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
