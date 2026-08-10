<script lang="ts">
  import { getSmokeContext } from "./smoke-context";

  const user = getSmokeContext();
</script>

<h1>Hello {user.name}!</h1>
