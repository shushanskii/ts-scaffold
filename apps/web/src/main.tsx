import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { App } from "#components/App";
import { createStore } from "#store";

const container = document.getElementById("root");

if (container === null) {
  throw new Error("mount point #root not found");
}

createRoot(container).render(
  <StrictMode>
    <Provider store={createStore()}>
      <App />
    </Provider>
  </StrictMode>,
);
