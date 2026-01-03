import type { BarChartData } from "$routes/(components)/chart-bar.svelte";

export type Total = {
  totalKWh: number;
  mainKWh: number;
  subKWh: number;
};

function calculateTotal(data: BarChartData[]): Total {
  return {
    totalKWh: data.reduce((acc, curr) => acc + curr.totalKWh, 0),
    mainKWh: data.reduce((acc, curr) => acc + curr.mainKWh, 0),
    subKWh: data.reduce((acc, curr) => acc + curr.subKWh, 0),
  };
}

self.onmessage = function (e: MessageEvent<{ data: BarChartData[] }>) {
  const { data } = e.data;
  const total = calculateTotal(data);
  self.postMessage(total);
};
