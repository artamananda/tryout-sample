import React from "react";
import { ConfigState, initialConfig } from "../types/config.type";

type IContext = {
  config: ConfigState;
  setConfig: (value: any) => void;
};

const configContext = React.createContext<IContext>({
  config: initialConfig,
  setConfig: () => {},
});

export default configContext;
