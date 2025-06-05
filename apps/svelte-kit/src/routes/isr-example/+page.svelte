<script>
  import QueryParams from '$lib/components/QueryParams.svelte';
  export let data;
</script>

<h1>ISR Example</h1>
<p>This page was generated at: <strong>{data.now}</strong></p>
<p>It will be regenerated at most every <strong>{data.revalidate}</strong> seconds (ISR).</p>

<QueryParams queryParams={data.queryParams} />

<p class="try-it">
  Try adding query parameters to the URL, for example:
  <code>?search=test&filter=active&sort=desc</code>
</p>

<style>
  .try-it {
    margin-top: 1rem;
    font-style: italic;
  }

  code {
    background: #f4f4f4;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
  }
</style>