import TableUser from "../../components/ListUsers/TableUser";
import { Typography } from "antd";

const { Title } = Typography;

const ListUserScreen = () => {
  return (
    <div>
      <Title style={{ fontWeight: "bold" }}>List User</Title>
      <TableUser role="user" />
    </div>
  );
};

export default ListUserScreen;
