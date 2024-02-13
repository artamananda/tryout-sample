import React, { useState } from "react";
import { ConfigState, initialConfig } from "../types/config.type";
import ConfigContext from "./ConfigContext";

type Props = {
  children?: React.ReactNode;
};

const ConfigProvider: React.FC<Props> = ({ children }) => {
  const [config, setConfig] = useState<ConfigState>(initialConfig);

  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};
export default ConfigProvider;
