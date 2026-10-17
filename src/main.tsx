import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { persistor, store } from "./store/store.ts";
import { BrowserRouter } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import { ToastContainer } from "react-toastify";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <App />
          <ToastContainer
            position="top-center"
            autoClose={1000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="light"
            toastClassName="!rounded-xl"
          />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
