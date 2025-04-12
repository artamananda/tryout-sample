const NotFoundScreen = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        columnGap: 10
      }}
    >
      <div style={{ display: 'flex', fontWeight: 'bold', fontSize: 30 }}>
        404
      </div>
      <div style={{ display: 'flex', fontSize: 30 }}>|</div>
      <div style={{ display: 'flex' }}>Page Not Found</div>
    </div>
  );
};

export default NotFoundScreen;
