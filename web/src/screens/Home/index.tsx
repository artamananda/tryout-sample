import { Button, Dropdown, Image, Layout, message, Typography } from 'antd';
import logo from '../../assets/logo-yellow.png';
import type { MenuProps } from 'antd';
import { useAuthUser, useSignOut } from 'react-auth-kit';
import { useNavigate } from 'react-router-dom';
import { DownOutlined, UserOutlined } from '@ant-design/icons';
import { EColor } from '../../constants/color';
import backgroundImage1 from '../../assets/background1.jpg';
import backgroundImage2 from '../../assets/background2.jpg';
import { useEffect, useState } from 'react';

const { Header, Content } = Layout;
const { Text, Title } = Typography;

const HomeScreen = () => {
  const signOut = useSignOut();
  const userAuth = useAuthUser();
  const authName = userAuth() ? userAuth()?.name : null;
  const navigate = useNavigate();

  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const backgrounds = [backgroundImage1, backgroundImage2];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeout(() => {
        setBackgroundIndex((prevIndex) =>
          prevIndex === backgrounds.length - 1 ? 0 : prevIndex + 1
        );
      }, 1000);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [backgrounds.length]);

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <text
          onClick={() => {
            signOut();
            navigate('/');
            message.success("You've been signed out");
          }}
        >
          Logout
        </text>
      )
    }
  ];
  return (
    <Layout
      style={{
        minHeight: '100vh',
        backgroundColor: 'white',
        backgroundImage: `url(${backgrounds[backgroundIndex]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 1s ease-in-out',
        transitionProperty: 'background-image'
      }}
    >
      <Header
        style={{
          backgroundColor: EColor.PRIMARY,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Image src={logo} width={120} preview={false} />
        {authName ? (
          <Dropdown menu={{ items }} placement="bottomLeft">
            <div style={{ color: 'white' }}>
              <UserOutlined style={{ marginRight: 5 }} />
              {authName} <DownOutlined style={{ marginLeft: 10 }} />
            </div>
          </Dropdown>
        ) : (
          <Button type="primary" onClick={() => navigate('/login')}>
            Login
          </Button>
        )}
      </Header>
      <Content
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Title style={{ fontWeight: 'bold', color: 'white' }}>
            Teras Belajar Asik
          </Title>
          <Text style={{ color: 'white' }}>
            {
              'Belajar UTBK ASIK (Agamis, Saintis, Sosial, Skolastik). Program gratis bagi anak Sumsel menuju PTN.'
            }
          </Text>
        </div>
      </Content>
    </Layout>
  );
};

export default HomeScreen;
