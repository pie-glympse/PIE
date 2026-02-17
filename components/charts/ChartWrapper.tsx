"use client";

import type { ReactNode } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export { Bar, Line, Doughnut };

export default function ChartWrapper({ children }: { children: (charts: { Bar: typeof Bar; Line: typeof Line; Doughnut: typeof Doughnut }) => ReactNode }) {
  return <>{children({ Bar, Line, Doughnut })}</>;
}
