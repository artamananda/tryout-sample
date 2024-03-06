import CreateTryout from "../../components/Tryout/CreateTryout";

const EditTryoutScreen = () => {
  return (
    <div>
      <div
        style={{
          position: "fixed",
          right: 10,
          zIndex: 99,
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: "#4287f5",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            cursor: "pointer",
            boxShadow: "0px 0px 5px 0px rgba(0,0,0,0.75)",
          }}
        >
          Save
        </div>
      </div>

      <CreateTryout />
    </div>
  );
};

export default EditTryoutScreen;
