import { Dropdown, Button, MenuProps, message } from 'antd';
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
  const authName = userAuth() ? userAuth()?.name : null;
  const navigate = useNavigate();

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
              src={process.env.PUBLIC_URL + '/img/logo.png'}
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
              <a href="/#portfolio" className="page-scroll">
                Galeri
              </a>
            </li>
            <li>
              <a href="/library" className="page-scroll">
                Perpustakaan Digital
              </a>
            </li>
            <li>
              <a href="/bank-soal" className="page-scroll">
                Bank Soal
              </a>
            </li>
            <li>
              <a href="/#testimonials" className="page-scroll">
                Testimoni
              </a>
            </li>
            <li>
              <a href="/#team" className="page-scroll">
                Tim
              </a>
            </li>
            <li>
              <a href="/#contact" className="page-scroll">
                Kontak
              </a>
            </li>
            <li>
              {authName ? (
                <a className="page-scroll">
                  <Dropdown menu={{ items }} placement="bottomLeft">
                    <div>
                      <UserOutlined style={{ marginRight: 5 }} />
                      {authName} <DownOutlined style={{ marginLeft: 10 }} />
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
