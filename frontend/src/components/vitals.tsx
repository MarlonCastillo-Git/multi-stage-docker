"use client";
import { useReportWebVitals } from "next/web-vitals";
export function Vitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "development")
      console.info("[Web Vitals]", {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
      });
  });
  return null;
}
