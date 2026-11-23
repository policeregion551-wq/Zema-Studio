import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initAnalytics } from "./firebase.ts";
import "./index.css";

void initAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
