import TableUser from "../../components/ListUsers/TableUser";
import { Typography } from "antd";

const { Title } = Typography;

const ListAdminScreen = () => {
  return (
    <div>
      <Title style={{ fontWeight: "bold" }}>List Admin</Title>
      <TableUser role="admin" />
    </div>
  );
};

export default ListAdminScreen;
