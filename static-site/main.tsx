import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CourseApp } from "../app/components/CourseApp";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <CourseApp />
  </StrictMode>,
);
