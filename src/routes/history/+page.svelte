<script>
  import { getBillingInfos } from "$/remotes/billing-info.remote";
  import { HistoryDataTable } from "$routes/history/(components)";
</script>

<HistoryDataTable
  data={await getBillingInfos({
    userId: "5wqtwauhbzkfcqo",
  })}
/>
