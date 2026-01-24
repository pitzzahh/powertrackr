import type { BarChartData } from "$routes/(components)/chart-bar.svelte";

export type Total = {
  totalkWh: number;
  mainKWh: number;
  subkWh: number;
};

function calculateTotal(data: BarChartData[]): Total {
  return {
    totalkWh: data.reduce((acc, curr) => acc + curr.totalkWh, 0),
    mainKWh: data.reduce((acc, curr) => acc + curr.mainKWh, 0),
    subkWh: data.reduce((acc, curr) => acc + curr.subkWh, 0),
  };
}

self.onmessage = function (e: MessageEvent<{ data: BarChartData[] }>) {
  const { data } = e.data;
  const total = calculateTotal(data);
  self.postMessage(total);
};
