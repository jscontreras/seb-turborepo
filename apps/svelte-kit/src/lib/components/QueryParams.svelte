<script lang="ts">
  interface QueryParams {
    [key: string]: string;
  }

  export let queryParams: QueryParams = {};
</script>

<div class="query-params">
  <h2>Query Parameters</h2>
  {#if Object.keys(queryParams).length === 0}
    <p>No query parameters present</p>
  {:else}
    <ul>
      {#each Object.entries(queryParams) as [key, value]}
        <li><strong>{key}:</strong> {value}</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .query-params {
    margin: 1rem 0;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin: 0.5rem 0;
  }
</style>