import { Flex, Layout, Image, Button } from 'antd';
import Option from './Option';
import Question from './Question';
import { Content, Footer, Header } from 'antd/es/layout/layout';
import Timer from './Timer';
import logo from '../../assets/logo.png';
import { Typography } from 'antd';

const { Text } = Typography;

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: 'white',
  fontWeight: 'bold',
  fontSize: '1.4rem',
  padding: 25,
  backgroundColor: '#04073B'
};

const Tryout = () => {
  return (
    <Flex gap="middle" wrap="wrap">
      <Layout
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}
      >
        <Header style={headerStyle}>
          <div>Penalaran Umum</div>
          {/* <div style={{ color: '#F9C92D' }}>TELISIK Tryout</div> */}
          <div>{Timer()}</div>
        </Header>
        <Content style={{ fontSize: 30, margin: 30 }}>
          <Text style={{ fontSize: 30 }}>Soal No. 1</Text>
          <div>
            <Question />
          </div>
          <Option />
        </Content>
        <Button
          style={{
            color: 'white',
            backgroundColor: '#04073B',
            marginInline: '30vw',
            paddingBlock: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {'Soal Selanjutnya >>>'}
        </Button>
        <Footer style={{ textAlign: 'center' }}>
          Telisik Tryout ©2024 Created by Artamananda
        </Footer>
      </Layout>
    </Flex>
  );
};

export default Tryout;
