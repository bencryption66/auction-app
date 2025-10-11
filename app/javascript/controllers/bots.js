import { Controller } from "@hotwired/stimulus";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

export default class extends Controller {
  connect() {
    console.log("Stimulus connected to bots controller!");

    const ctx = document.getElementById("equityChart").getContext("2d");

    // Fake data for the chart
    const data = {
      labels: ["January", "February", "March", "April", "May", "June"],
      datasets: [
        {
          label: "Balance",
          data: [1000, 1200, 1500, 1300, 1700, 1900],
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderWidth: 2,
          tension: 0.4, // Smooth curve
        },
      ],
    };

    // Chart configuration
    const config = {
      type: "line",
      data: data
    };

    // Render the chart
    new Chart(ctx, config);
  }
}
